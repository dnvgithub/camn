using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text;

namespace CamnLib.DbModels
{
  public class FlowWorksSite
  {
    [Key]
    [Column("STATION_ID")]
    public int stationId { get; set; }

    [Column("STATION_NAME")]
    public string stationName { get; set; }

    [Column("FW_SITE_ID")]
    public int siteId { get; set; }
  }
}
