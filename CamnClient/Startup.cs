using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.HttpsPolicy;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SpaServices.AngularCli;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using CamnLib;
using CamnLib.DbModels;
using CamnLib.JsonModels;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Server.IISIntegration;
using Microsoft.AspNetCore.Http;
using System;
using Microsoft.AspNetCore.Rewrite;

namespace CamnClient
{
  public class Startup
  {
    public Startup(IConfiguration configuration)
    {
      Configuration = configuration;
    }

    public IConfiguration Configuration { get; }

    // This method gets called by the runtime. Use this method to add services to the container.
    public void ConfigureServices(IServiceCollection services)
    {
      services.AddMvc().SetCompatibilityVersion(CompatibilityVersion.Version_2_2);

      services.AddDbContextPool<CamnContext>(options => options.UseSqlServer(Configuration.GetConnectionString("CamnContextWriter")));
      services.AddDbContextPool<JDEContext>(options => options.UseSqlServer(Configuration.GetConnectionString("JDEContext")));
      services.AddSingleton(new InMemoryLog());
      services.AddHostedService<BackgroundLogger>();


      services.AddAuthentication(IISDefaults.AuthenticationScheme);

      services.AddCors(options =>
      {
        options.AddPolicy("SimpleCorsPolicy",
                policyBuilder => policyBuilder
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .WithOrigins(Configuration["CORS:WithOrigins"])
                  .AllowCredentials());
      });

      // In production, the Angular files will be served from this directory
      //services.AddSpaStaticFiles(configuration =>
      //{
      //  configuration.RootPath = "ClientApp/dist";
      //});
    }

    // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
    public void Configure(IApplicationBuilder app, IHostingEnvironment env)
    {
      if (env.IsDevelopment())
      {
        app.UseDeveloperExceptionPage();
      }
      else
      {
        app.UseExceptionHandler("/Error");
        // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
        app.UseHsts();
      }

      app.UseCors("SimpleCorsPolicy");

      app.UseHttpsRedirection();
      app.UseStaticFiles();
      //app.UseSpaStaticFiles();

      //RewriteOptions rewriteOptions = new RewriteOptions()
      //  .AddRewrite(@"(.+)/camn/arcgis(.*)", "$1/arcgis$2", true);

      //app.UseRewriter(rewriteOptions);

      var proxyConfig = Configuration.GetSection("proxyConfig").Get<ProxyConfig>();

      app.MapWhen(IsArcGIS, builder => builder.RunProxy(new ProxyOptions
      {
        Scheme = proxyConfig.scheme,
        Host = proxyConfig.host,
        Port = proxyConfig.port
      }));

      app.UseMvc(routes =>
      {
        routes.MapRoute(
                  name: "default",
                  template: "{controller=Home}/{action=Index}");

        routes.MapSpaFallbackRoute("spa-fallback", new { controller = "Home", action = "Index" });
      });

      //app.UseSpa(spa =>
      //{
      //        // To learn more about options for serving an Angular SPA from ASP.NET Core,
      //        // see https://go.microsoft.com/fwlink/?linkid=864501

      //        spa.Options.SourcePath = "ClientApp";

      //  if (env.IsDevelopment())
      //  {
      //    spa.UseAngularCliServer(npmScript: "start");
      //  }
      //});

    }

    // Proxy calls to ArcGIS
    private static bool IsArcGIS(HttpContext httpContext)
    {
      return httpContext.Request.Path.Value.Contains(@"arcgis", StringComparison.OrdinalIgnoreCase);
    }
  }
}
