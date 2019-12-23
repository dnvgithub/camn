using System;
using System.Collections.Generic;
using System.Text;

namespace CamnLib.JsonModels
{
  public class ChannelData
  {
    public int requeststatus { get; set; }
    public string msg { get; set; }
    public string username { get; set; }
    public List<Datapoint> datapoints { get; set; }
  }

  public class Datapoint
  {
    public DateTime date { get; set; }
    public double value { get; set; }
  }
}
