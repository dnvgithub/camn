using CamnLib.JsonModels;
using System;
using System.Collections.Generic;
using System.Text;

namespace CamnLib.Models
{
  public class AppConfig
  {
    public DnvMapState InitialDnvMapState { get; set; }
    public string DefaultPath { get; set; }
    public string WebApiEndpoint { get; set; }
    public string CCTVMediaService { get; set; }
    public string DnvButtonsUrl { get; set; }
    public string DnvSearchApiEndpoint { get; set; }
    public LoggingOption LoggingOption { get; set; }

    public string[] Properties { get; set; }

    public string LegendsUrl { get; set; }
  }
}
