using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading.Tasks;

namespace CamnClient.Controllers
{
  public class BaseController : Controller
  {
    protected readonly IConfiguration config;
    private readonly IHostingEnvironment env;

    public BaseController(IConfiguration config)
    {
      this.config = config;
    }

    public BaseController(IConfiguration config, IHostingEnvironment env) : this(config)
    {
      this.env = env;
    }

    protected async Task<dynamic> GetResultAsync<T>(string apiUrl, bool mightUseDifferentType = false)
    {
      dynamic result = default(T);

      Uri uri;
      if (!Uri.TryCreate(apiUrl, UriKind.Absolute, out uri))
      {
        var path = env.WebRootPath + (apiUrl.StartsWith("/") ? apiUrl : "/" + apiUrl);
        if (System.IO.File.Exists(path))
        {
          result = JsonConvert.DeserializeObject<T>(System.IO.File.ReadAllText(path));
        }
      }
      else
      {
        using (var client = new HttpClient())
        {
          client.BaseAddress = uri;

          client.DefaultRequestHeaders.Accept.Clear();
          client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

          HttpResponseMessage response = await client.GetAsync(apiUrl);
          if (response.IsSuccessStatusCode)
          {
            var data = await response.Content.ReadAsStringAsync();
            if (typeof(T) != typeof(string))
            {
              result = JsonConvert.DeserializeObject<T>(data);
            }
            else
            {
              result = (T)Convert.ChangeType(data, typeof(T));
            }
          }
        }
      }

      return result;
    }

    protected async Task<dynamic> GetImgResultAsync(string apiUrl)
    {
      using (var client = new HttpClient())
      {
        var response = await client.GetByteArrayAsync(apiUrl);

        return response;
      }
    }
  }
}
