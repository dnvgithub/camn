using System;
using System.Collections.Generic;
using System.Text;

namespace CamnLib.JsonModels
{
  public class LoggingOption
  {
    public bool logToDB { get; set; }
    public string level { get; set; }

    public bool collapsed { get; set; }

    public bool duration { get; set; }

    public bool timestamp { get; set; }

    public LoggerFilterOption filter { get; set; }
  }

  public class LoggerFilterOption
  {
    public List<string> whitelist { get; set; } = new List<string>();

    public List<string> blacklist { get; set; } = new List<string>();
  }
}
