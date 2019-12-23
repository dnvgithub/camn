using CamnLib.JsonModels;
using System;
using System.Collections.Generic;
using System.Text;
using System.ComponentModel.DataAnnotations.Schema;

namespace CamnLib.DbModels
{

    public class TableLayer
    {
        [ForeignKey("Layer")]
        public int Layer_Id { get; set; }
        [ForeignKey("LayerFeatureVersion")]
        public int Layer_Version_Id { get; set; }
        public string FullUrl { get; set; }
        [NotMapped]
        public string FeatureDomain { get; set; }
        public string Url { get; set; }

        public string WriteUrl { get; set; }
        public virtual List<TableMeta> TableMeta { get; set; }
    }
}
