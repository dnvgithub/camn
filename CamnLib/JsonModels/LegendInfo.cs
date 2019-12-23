using System;
using System.Collections.Generic;
using System.Text;

namespace CamnLib.JsonModels
{
    public class LegendInfo
    {
        public List<LayerInfo> Layers { get; set; }
    }

    public class LayerInfo
    {
        public int LayerId { get; set; }
        public string LayerName { get; set; }
        public string LayerType { get; set; }
        public int MinScale { get; set; }
        public int MaxScale { get; set; }
        public ICollection<Legend> Legend { get; set; }
    }

    public class Legend
    {
        public string Label { get; set; }
        public string url { get; set; }
        public string ImageData { get; set; }
        public string ContentType { get; set; }
        public int Height { get; set; }
        public int Width { get; set; }
        public ICollection<string> Values { get; set; }
    }
}
