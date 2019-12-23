using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text;

namespace CamnLib.DbModels
{
    public class Basemap
    {
        [Key]
        public string url { get; set; }
        public double opacity { get; set; }
        public string name { get; set; }
        public string thumbnail { get; set; }
        public bool selected { get; set; }
    }
}
