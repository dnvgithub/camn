using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text;

namespace CamnLib.DbModels
{
  public class UserAction
  {
    [Key]
    [JsonIgnore]
    public int id { get; set; }

    [Column("User_Name")]
    public string userName { get; set; }

    public string application { get; set; }

    public string action { get; set; }

    public string details { get; set; }
    
    public DateTime timestamp { get; set; }
  }
}
