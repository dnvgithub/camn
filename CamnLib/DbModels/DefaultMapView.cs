using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CamnLib.DbModels
{
  public class DefaultMapView
  {
    [Key]
    //[JsonIgnore]
    public int Id { get; set; }

    [Required, Column("USER_NAME"), MaxLength(50)]
    public string UserName { get; set; }

    [Required, MaxLength(50)]
    public string Application { get; set; }

    public DateTime Timestamp { get; set; }

    //[Required, MaxLength(36)]
    //public string MapViewId { get; set; }
    public int MapViewId { get; set; }
  }
}
