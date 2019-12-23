using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

using Newtonsoft.Json;

namespace CamnLib.DbModels
{
  public class MapView
  {
    [Key]
    //[JsonIgnore]
    public int Id { get; set; }

    [Required, Column("USER_NAME"), MaxLength(50)]
    public string UserName { get; set; }

    [Required, Column("BOOKMARK_NAME"), MaxLength(50)]
    public string BookmarkName { get; set; }

    [Required, MaxLength(50)]
    public string Application { get; set; }

    public string Data { get; set; }

    //[JsonIgnore]
    public DateTime Timestamp { get; set; }

    [Required, MaxLength(36)]
    public string ShareId { get; set; }
  }
}
