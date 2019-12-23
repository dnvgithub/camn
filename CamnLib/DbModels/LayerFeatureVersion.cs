using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace CamnLib.DbModels
{
  public class LayerFeatureVersion
  {
    [Key]
    public int id { get; set; }

    public string Layer_Feature_Domain { get; set; }

    public DateTime timestamp { get; set; }

    public string Proxy_Domain { get; set; }

    public string Version { get; set; }
  }
}
