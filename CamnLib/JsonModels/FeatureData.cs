using System;
using System.Collections.Generic;
using System.Text;

namespace CamnLib.JsonModels
{
  public class FeatureData
  {
    public Feature feature { get; set; }
  }

  public class Feature
  {
    public Attributes attributes { get; set; }
    public Geometry geometry { get; set; }
  }
}
