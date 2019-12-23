using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using CamnLib.JsonModels;
using CamnLib.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;

namespace CamnClient.Controllers
{
  [Authorize]
  public class HomeController : Controller
  {
    private readonly IConfiguration _config;

    public IActionResult Index(string values = "")
    {
      var initialMapState = _config.GetSection("initialDnvMapState").Get<DnvMapState>();
      var logOption = _config.GetSection("loggingOptions").Get<LoggingOption>();

      var appConfig = new AppConfig {
        InitialDnvMapState = initialMapState,
        WebApiEndpoint = _config["appConfig:webApiEndpoint"],
        CCTVMediaService = _config["appConfig:cctvMediaService"],
        DnvButtonsUrl = _config["appConfig:dnvButtonsUrl"],
        DefaultPath = "/camn",
        DnvSearchApiEndpoint = _config["appConfig:dnvSearchApiEndpoint"],
        LoggingOption = logOption,
        LegendsUrl = _config["appConfig:LegendsUrl"]
      };
      
      return View("Index", appConfig);
    }

    public HomeController(IConfiguration config)
    {
      _config = config;
    }
  }
}