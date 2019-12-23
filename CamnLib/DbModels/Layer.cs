using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text;
using CamnLib.JsonModels;
using Newtonsoft.Json;

namespace CamnLib.DbModels
{
    public class Layer
    {
        [Key]
        public int id { get; set; }
        public string name { get; set; }
        public byte type { get; set; }

        [JsonProperty(PropertyName = "minZoom")]
        public int min_Zoom { get; set; }

        [NotMapped]
        public virtual List<FeatureLayer> featureLayers { get; set; }

        [NotMapped]
        public virtual List<TableLayer> tableLayers { get; set; }

        [NotMapped]
        public string uid { get; set; }

        [NotMapped]
        public bool canFilter { get; set; }

        [NotMapped]
        public bool showFilterPanel { get; set; }

        [NotMapped]
        public string whereClause { get; set; }

        [NotMapped]
        public string gisLayerNum { get; set; }

        [NotMapped]
        public int featureCount { get; set; }

        [NotMapped]
        public bool loadingFiltercount { get; set; }

        [NotMapped]
        public int sequence { get; set; }

        [NotMapped]
        public virtual List<Meta> meta { get; set; }


        [NotMapped]
        public virtual List<FieldFilters> fieldFilters { get; set; }

        
  }

}
