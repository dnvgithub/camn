using CamnLib.JsonModels;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text;

namespace CamnLib.DbModels
{
    public class FeatureLayer
    {


        [ForeignKey("Layer")]
        public int layer_Id { get; set; }
        [ForeignKey("LayerFeatureVersion")]
        public int layer_Version_Id { get; set; }
        [Key]
        public string url { get; set; }

        //Only used for grabbing layer meta.
        [NotMapped]
        public string fullLayerUrl { get; set; }
        [NotMapped]
        public string FeatureDomain { get; set; }
        public double opacity { get; set; }
        public string propertyLabel { get; set; }
        public string type { get; set; }

        [NotMapped]
        public string gisLayerNum { get; set; }

        public Boolean allow_inspections { get; set; }

        [NotMapped]
        public bool hasAttachments { get; set; }

        private List<FieldFilters> fieldfilters = null;

        [NotMapped]
        public virtual List<FieldFilters> fieldFilters { get { return fieldfilters; } set { fieldfilters = value; } }

        private string whereclause = "1=1";

        [NotMapped]
        public string whereClause { get { return whereclause; } set { whereclause = value; } }
        public bool can_filter { get; set; }

        [Column("WRITE_URL")]
        public string WriteUrl { get; set; }

        public bool ShouldSerializelayer_Id()
        {
            return (layer_Id != this.layer_Id);
        }

        public bool ShouldSerializelayer_version_Id()
        {
            return (layer_Version_Id != this.layer_Version_Id);
        }
    }
}
