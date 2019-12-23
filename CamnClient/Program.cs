using Microsoft.AspNetCore;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using System.IO;

namespace CamnClient
{
    public class Program
    {
        public static void Main(string[] args)
        {
            CreateWebHostBuilder(args).Build().Run();

            var host = new WebHostBuilder()
    .UseKestrel()
    .UseContentRoot(Directory.GetCurrentDirectory())
    .UseUrls("https://localhost:44319")
    .UseIISIntegration()
    .UseStartup<Startup>()
    .Build();

            host.Run();
        }

        public static IWebHostBuilder CreateWebHostBuilder(string[] args) =>

            WebHost.CreateDefaultBuilder(args)
          .UseWebRoot("wwwroot")
          .UseStartup<Startup>()
               .ConfigureAppConfiguration((hostingContext, builder) =>
            {
                IHostingEnvironment env = hostingContext.HostingEnvironment;

                builder.AddJsonFile("appsettings.json", optional: false, reloadOnChange: true);
                builder.AddJsonFile($"appsettings.{env.EnvironmentName}.json", optional: false, reloadOnChange: true);
                builder.AddEnvironmentVariables();
                IConfigurationRoot config = builder.Build();
                builder.AddAzureKeyVault(config["camnBaseUrl"], config["camnClientID"], config["camnClientSecret"]);
                config = builder.Build();
            });
    }
}
