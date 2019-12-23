using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Text;

namespace CamnLib.JsonModels
{
  public class SurroundingFeatures
  {
    public string name { get; set; }

    public List<List<string>> kvPairs { get; set; }

    public string objectId { get; set; }

    public string url { get; set; }

    public string writeUrl { get; set; }

    public bool allowInsp { get; set; }

    public int featureId { get; set; }

    public string assetId { get; set; }
  }
}
