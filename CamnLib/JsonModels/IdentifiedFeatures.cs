using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Text;

namespace CamnLib.JsonModels
{
  public class IdentifiedFeatures
  {
    public List<Result> results { get; set; }
  }

  public class Result
  {
    public int layerId { get; set; }
    public string layerName { get; set; }
    public string displayFieldName { get; set; }
    public string value { get; set; }
    public Attributes attributes { get; set; }
    public string geometryType { get; set; }
    public Geometry geometry { get; set; }
  }

  public class Attributes
  {
    public string OBJECTID { get; set; }

    [JsonProperty("Asset Id")]
    public string Asset_Id { get; set; }
    public string AM_Owner { get; set; }
    public string AM_Dept { get; set; }
    public string AM_Date { get; set; }
    public string AM_Material { get; set; }
    public string AM_Size { get; set; }
    public string AM_Type { get; set; }
    public string Draw_Type { get; set; }
    public string Comments { get; set; }
    public string Flume_Up_Elev { get; set; }
    public string Flume_Dn_Elev { get; set; }
    public string Offset { get; set; }
    public string Flume_Asb_Length { get; set; }
    public string Flume_Asb_Slope { get; set; }
    public string Flume_Calc_Slope { get; set; }
    public string Creek_Name { get; set; }
    public string Creek_Type { get; set; }
    public string Channel_Type { get; set; }
    public string Channel_Width { get; set; }
    public string Wet_Width { get; set; }
    public string Water_Depth { get; set; }
    public string Bank_Surface { get; set; }
    public string Creek_Substrate { get; set; }
    public string Creek_Sediment_Load { get; set; }
    public string Creek_Constricted { get; set; }
    public string Creek_LWD_or_LOD { get; set; }
    public string Creek_Altered { get; set; }
    public string Creek_Sensitivity_Rating { get; set; }
    public string Fish_Bearing { get; set; }
    public string SHAPE { get; set; }
    public string LastEditor { get; set; }
    public string LastEditDate { get; set; }

    [JsonProperty("SHAPE.STLength()")]
    public string STLength { get; set; }
  }

  public class SpatialReference
  {
    public int wkid { get; set; }
    public int latestWkid { get; set; }
  }

  public class Geometry
  {
    public List<object> paths { get; set; }
    public SpatialReference spatialReference { get; set; }
  }
}
