using System;
using System.Collections.Generic;
using System.Text;

namespace CamnLib.DbModels
{
  public class SiteChannels
  {
    public int requeststatus { get; set; }
    public string msg { get; set; }
    public string username { get; set; }
    public List<Site> sites { get; set; }
  }

  public class Channel
  {
    public int id { get; set; }
    public string name { get; set; }
    public string unit { get; set; }
  }

  public class Site
  {
    public int id { get; set; }
    public string name { get; set; }
    public string longitude { get; set; }
    public string latitude { get; set; }
    public List<Channel> channels { get; set; }
  }
}
