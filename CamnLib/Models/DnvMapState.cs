using System;
using System.Collections.Generic;
using System.Text;

namespace CamnLib.Models
{
    public class DnvMapState
    {
        public string MapId { get; set; }
        public string ServiceEndpoint { get; set; }
        public DnvLatLng CenterPoint { get; set; }
        public DnvLatLng NorthWestBound { get; set; }
        public DnvLatLng SouthEastBound { get; set; }
        public int[] Origin { get; set; }
        public double[] Resolutions { get; set; }
        public int ZoomLevel { get; set; }

        public DnvMap[] Basemaps { get; set; } = Array.Empty<DnvMap>();
        public DnvMap[] FeatureLayers { get; set; } = new DnvMap[] { };
        public DnvGeoJsonLayer[] geoJsonLayers { get; set; } = new DnvGeoJsonLayer[] { };
        public string zoomToGeoJsonUrl { get; set; }
        public DnvMarker[] Markers { get; set; } = new DnvMarker[] { };

        public Boolean showDrawControl { get; set; } = true;

        public string startDraw { get; set; } = string.Empty;

        public Boolean isDrawing { get; set; } = false;

        public DnvDrawnShapes[] features { get; set; } = new DnvDrawnShapes[] { };

        //public string[] measuredShapes { get; set; } = new string[] { };

        public bool expandFeaturePanel { get; set; }

        public string[] excludeFeatureInfo { get; set; } = new string[] { };        

        public string selectedFeatureLayer { get; set; }

        public DnvClusterOptions clusterOptions { get; set; }

        public DnvHighLight highlightFeature { get; set; }

        public int featureClickType { get; set; }

        public features surroundingFeatureList { get; set; }

        public RequestFitBounds requestFitBounds { get; set; }

        public List<List<string>> selectedSurroundingFeature { get; set; }

        public bool featureClick { get; set; }
    }

    public class features
    {
        public string name { get; set; }
        public List<List<string>> kvPairs { get; set; }
        public string objectId { get; set; }
        public string url { get; set; }
        public string writeUrl { get; set; }
        public bool allowInsp { get; set; }
        public int featureId { get; set; }
    }

    public class DnvHighLight
    {
        public string url { get; set; }
        public int objectId { get; set; }
    }

    public class RequestFitBounds
    {
      public DnvLatLng NorthWestBound { get; set; }
      public DnvLatLng SouthEastBound { get; set; }
    }

    public class DnvLatLng
    {
        public double Lat { get; set; }
        public double Lng { get; set; }
    }

    public class DnvMap
    {
        public string Url { get; set; }
        public float Opacity { get; set; }
    }

    public class DnvMarker
    {
        public string Url { get; set; }
        public DnvLatLng CenterPoint { get; set; }
        public DnvMarkerIcon Icon { get; set; }
        public object SvgIcon { get; set; }
    }

    public class DnvMarkerIcon
    {
        public string IconUrl { get; set; }
        public string ShadowUrl { get; set; }
        public float[] IconSize { get; set; }
        public float[] ShadowSize { get; set; }
        public float[] IconAnchor { get; set; }
        public float[] ShadowAnchor { get; set; }
        public float[] PopupAnchor { get; set; }
    }

    public class DnvGeoJsonLayer
    {
        public string url { get; set; }
        public string json { get; set; }
    }

    public class DnvDrawnShapes
    {
        public string type { get; set; }
        public string shapeId { get; set; }
        public ShapeGeometry geometry { get; set; }
        public int leafletId { get; set; }

        public ShapeProperties[] properties { get; set; }
    }

    public class ShapeGeometry
    {
        public DnvLatLng[] coordinates { get; set; }
        public int radius { get; set; }
        public string type { get; set; }
    }

    public class ShapeProperties
    {
        public string note { get; set; }
        public bool isSelected { get; set; }
    }

    public class DnvClusterOptions
    {
        public int disableClusteringAtZoom { get; set; }
        public int maxClusterRadius { get; set; }

        public bool spiderfyOnMaxZoom { get; set; }
    }
}
