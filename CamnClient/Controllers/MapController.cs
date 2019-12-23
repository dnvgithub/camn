using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using CamnLib.DbModels;
using CamnLib.JsonModels;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using CamnLib;
using System.Globalization;
using System.Text.RegularExpressions;
using System.Web;
using CsvHelper;
using System.Dynamic;

namespace CamnClient.Controllers
{
  [Route("api")]
  public class MapController : BaseController
  {
    private readonly CamnContext _context;
    private readonly JDEContext _jdeContext;
    private IConfiguration _config;
    private readonly string _domainUrl;
    private readonly string _domainUrlRoot;
    private readonly string _proxyDomainUrl;

    public MapController(IConfiguration config, IHostingEnvironment env, CamnContext context, JDEContext jdeContext) : base(config, env)
    {
      var version = context.Layer_Feature_Version.OrderByDescending(t => t.timestamp).FirstOrDefault<LayerFeatureVersion>().Version;
      _context = context;
      _jdeContext = jdeContext;
      _config = config;
      _domainUrlRoot = _context.Layer_Feature_Version.OrderByDescending(t => t.timestamp).FirstOrDefault<LayerFeatureVersion>().Layer_Feature_Domain;
      _domainUrl = _context.Layer_Feature_Version.OrderByDescending(t => t.timestamp).FirstOrDefault<LayerFeatureVersion>().Layer_Feature_Domain + version;

      //Better future implementation to not use config["Host"]?? 
      _proxyDomainUrl = config["Host"].Length > 0 ? config["Host"] + version :
        _context.Layer_Feature_Version.OrderByDescending(t => t.timestamp).FirstOrDefault<LayerFeatureVersion>().Proxy_Domain + version;
    }

    [Route("layers")]
    [HttpGet]
    public async Task<IActionResult> GetLayersAsync()
    {
      List<Layer> layers = new List<Layer>();

      try
      {
        layers = await (from l in _context.Layers
                        join f in _context.Layer_Features on l.id equals f.layer_Id into gj
                        select new Layer
                        {
                          id = l.id,
                          name = l.name,
                          type = l.type,
                          min_Zoom = l.min_Zoom,
                          featureLayers = gj.Where(a => a.type != "Table").ToList(),
                          tableLayers = gj.Where(a => a.type == "Table").Select(a => new TableLayer()
                          {
                            Layer_Id = a.layer_Id,
                            Layer_Version_Id = a.layer_Version_Id,
                            Url = a.url,
                            WriteUrl = a.WriteUrl
                          }).ToList(),
                          uid = l.name + "-uid",
                          canFilter = true,
                          showFilterPanel = false,
                          fieldFilters = new List<FieldFilters>(),
                          whereClause = "1=1",
                          featureCount = -1,
                          loadingFiltercount = false,
                          meta = null,
                          sequence = 0
                        }).ToListAsync();

        foreach (Layer l in layers)
        {
          foreach (FeatureLayer fl in l.featureLayers)
          {
            l.canFilter = fl.can_filter;

            fl.gisLayerNum = fl.url.Substring(fl.url.LastIndexOf('/') + 1);
            fl.FeatureDomain = _proxyDomainUrl;
          }

          foreach (TableLayer tl in l.tableLayers)
          {
            tl.FeatureDomain = _proxyDomainUrl;
          }
        }
      }
      catch (Exception e)
      {
        Console.WriteLine(e.StackTrace);
      }

      foreach (Layer l in layers)
      {
        List<Meta> metaData = new List<Meta>();
        List<object> data = new List<object>();
        List<TableMeta> tableMetaData = new List<TableMeta>();
        foreach (FeatureLayer fl in l.featureLayers)
        {

          try
          {
            var json = await GetResultAsync<Object>(_domainUrl + fl.url + "/?f=json");

            //Proxy URL 
            fl.url = fl.FeatureDomain + fl.url;
            data.Add(json);
            JObject jO = JObject.Parse(json.ToString());
            fl.hasAttachments = (bool)jO["hasAttachments"];
            if (!String.IsNullOrEmpty(fl.WriteUrl))
            {
              fl.WriteUrl = fl.FeatureDomain + fl.WriteUrl;
            }

          }
          catch (NullReferenceException n)
          {
            fl.hasAttachments = false;
          }
          catch (Exception e)
          {

          }


        }
        metaData = await ProcessMetaAsync(data);

        foreach (var md in metaData)
        {
          if (md.domain.Count > 0)
          {
            foreach (var domain in md.domain)
            {
              domain.name = formatDomainValue(domain.name);
            }
          }
        }

        l.meta = CheckMetaAsync(metaData);

        //make dictionary for 'tables'
        foreach (var tl in l.tableLayers)
        {
          //needs to use WriteUrl because the fields would be editable: false otherwise
          var json = await GetResultAsync<Object>(_domainUrl + tl.WriteUrl + "/?f=json");
          List<TableMeta> tableMeta = new List<TableMeta>();
          for (int i = 0; i < json["fields"].Count; i++)
          {
            var tblData = json["fields"][i];
            var tblMeta = new TableMeta();
            foreach (var j in tblData)
            {
              switch (j.Name)
              {
                case "name":
                  tblMeta.name = j.Value.ToString();
                  break;
                case "alias":
                  tblMeta.alias = j.Value.ToString();
                  break;
                case "editable":
                  tblMeta.editable = j.Value;
                  break;
                case "nullable":
                  tblMeta.nullable = j.Value;
                  break;
                case "length":
                  tblMeta.length = Convert.ToInt16(j.Value);
                  break;
                case "type":
                  tblMeta.type = j.Value.ToString();
                  break;
                case "readonly":
                  tblMeta.readOnly = j.Value;
                  break;
                case "domain":
                  tblMeta.domain = j.Value.ToObject<TableMetaDomain>();
                  break;
                default:
                  break;
              }

            }
            tableMeta.Add(tblMeta);
          }
          tl.TableMeta = tableMeta;
        }

      }

      var result = JsonConvert.SerializeObject(layers, Formatting.None,
                        new JsonSerializerSettings()
                        {
                          ReferenceLoopHandling = ReferenceLoopHandling.Ignore
                        });

      return Ok(result);
    }

    [Route("layerProxy/{*mapServer}")]
    [HttpGet]
    public async Task<IActionResult> GetLayerProxyAsync(string mapServer)
    {
      string queryString = Request.QueryString.Value;

      var remoteUrl = _domainUrl + "/" + mapServer + Request.QueryString.Value;

      using (var client = new System.Net.Http.HttpClient())
      {
        client.BaseAddress = new Uri(remoteUrl);

        client.DefaultRequestHeaders.Accept.Clear();
        if (Request.Headers.Keys.Contains("Accept"))
          client.DefaultRequestHeaders.Accept.ParseAdd(Request.Headers["Accept"]);

        System.Net.Http.HttpResponseMessage response = await client.GetAsync(client.BaseAddress);
        var data = await response.Content.ReadAsByteArrayAsync();
        var contentType = response.Content.Headers.ContentType;

        return File(data, contentType.ToString());
      }
    }


    [Route("basemaps")]
    [HttpGet]
    public async Task<IActionResult> GetBasemapsAsync()
    {
      var basemaps = await _context.Basemaps.ToListAsync();

      var result = JsonConvert.SerializeObject(basemaps, Formatting.None,
                        new JsonSerializerSettings()
                        {
                          ReferenceLoopHandling = ReferenceLoopHandling.Ignore
                        });

      return Ok(result);
    }

    [Route("getFeatureData")]
    [HttpGet]
    public async Task<IActionResult> GetFeatureData(string url)
    {
      string result = "";
      List<List<string>> attributes = new List<List<string>>();
      try
      {
        var feature = await GetResultAsync<Object>(url.Replace(_proxyDomainUrl, _domainUrl));

        var jObj = (JObject)feature["feature"]["attributes"];

        foreach (var x in jObj)
        {
          attributes.Add(new List<string> { x.Key, x.Value.ToString() });
        }

        result = JsonConvert.SerializeObject(attributes);
      }
      catch (Exception e)
      {
        Console.WriteLine(e.Message);
      }

      return Ok(result);
    }

    [Route("identifyFeatures")]
    [HttpGet]
    public async Task<IActionResult> IdentifyFeaturesAsync(string latlng, string northWestBound, string southEastBound, string imageDisplay, string layerNum, string where)
    {
      var url = String.Format("{5}/MapServer/identify?sr=4326&tolerance=5" +
        "&layers=all:{4}" +
        "&returnGeometry=true&imageDisplay={0}&mapExtent={1},{2}" +
        "&geometry={3}&geometryType=esriGeometryPoint&f=json", imageDisplay + ",96", northWestBound, southEastBound, latlng, layerNum, _domainUrl);

      string result = "";

      try
      {


        IdentifiedFeatures idFeatures = await GetResultAsync<IdentifiedFeatures>(url);
        List<SurroundingFeatures> sdFeatures = new List<SurroundingFeatures>();

        Dictionary<string, List<string>> resIds = new Dictionary<string, List<string>>();

        //make dictionary for surrounding features results layerId-{objId}
        for (int j = 0; j < idFeatures.results.Count; j++)
        {
          var resLyrId = idFeatures.results[j].layerId.ToString();
          var resObjId = idFeatures.results[j].attributes.OBJECTID;
          if (resIds.ContainsKey(resLyrId))
          {
            resIds[resLyrId].Add(resObjId);
          }
          else
          {
            resIds.Add(resLyrId, new List<string> { resObjId });
          }
        }

        Dictionary<string, List<string>> filteredIds = new Dictionary<string, List<string>>();

        //filter list by using /Query and passing list of objectIds and where clause
        if (!string.IsNullOrEmpty(where))
        {
          var whereArr = where.Split(",");
          for (int i = 0; i < whereArr.Length; i++)
          {
            if (whereArr[i].Length > 0)
            {
              //'whereArr' item format: layer id|url|whereclause
              var lyrArr = whereArr[i].Split("|");

              if (resIds.ContainsKey(lyrArr[0]))
              {

                var listString = String.Join(",", resIds[lyrArr[0]]);
                var queryUrl = String.Format("{0}/MapServer/{1}/query?where={2}&objectIds={3}&outFields=OBJECTID&f=json", _domainUrl, lyrArr[0], HttpUtility.UrlEncode(lyrArr[1]), listString);
                var filtered = await GetResultAsync<Object>(queryUrl);
                var jFeatures = ((JObject)filtered)["features"];

                //make dictionary for filtered results layerId-{objId}
                if (jFeatures.HasValues)
                {
                  foreach (var j in jFeatures)
                  {
                    var oId = (j["attributes"]["OBJECTID"]).ToObject<string>();
                    if (filteredIds.ContainsKey(lyrArr[0]))
                    {
                      filteredIds[lyrArr[0]].Add(oId);
                    }
                    else
                    {
                      filteredIds.Add(lyrArr[0], new List<string> { oId });
                    }
                  }
                }
                else
                {
                  //filter excludes all features on layer, add layer id to dictionary with blank list
                  filteredIds.Add(lyrArr[0], new List<string> { });

                }
              }

            }
          }

        }


        foreach (Result idFeature in idFeatures.results)
        {
          var objId = idFeature.attributes.OBJECTID;
          var lid = idFeature.layerId;
          bool addFeature = true;
          //check if object Id is in filteredIds list
          if (filteredIds.Count > 0)
          {
            if (filteredIds.ContainsKey(lid.ToString()))
            {
              //if objectId not in filteredId dictionary, do not include
              if (!filteredIds[lid.ToString()].Contains(objId))
              {
                addFeature = false;
              }
            }
          }

          if (addFeature)
          {
            var layerFeature = await _context.Layer_Features.Join(
              _context.Layer_Feature_Version,
              LF => LF.layer_Version_Id,
              LFV => LFV.id,
              (LF, LFV) => new
              {
                url = LF.url,
                layer = _proxyDomainUrl + LF.WriteUrl,
                allowInsp = LF.allow_inspections
              }).Where(obj => obj.url == "/MapServer/" + idFeature.layerId).FirstOrDefaultAsync();

            SurroundingFeatures sdFeature = new SurroundingFeatures();
            sdFeature.kvPairs = new List<List<string>>();
            sdFeature.url = _proxyDomainUrl + "/MapServer/" + idFeature.layerId; ;

            sdFeature.writeUrl = layerFeature.layer;
            sdFeature.allowInsp = layerFeature.allowInsp;
            sdFeature.featureId = idFeature.layerId;
            sdFeature.assetId = idFeature.attributes.Asset_Id;

            var layerId = idFeature.layerId;

            var attrKvPair = GetValues(idFeature.attributes);
            sdFeature.name = idFeature.layerName;
            foreach (KeyValuePair<string, string> attr in attrKvPair)
            {
              sdFeature.kvPairs.Add(new List<string> { attr.Key, attr.Value });
              if (attr.Key == "OBJECTID")
                sdFeature.objectId = attr.Value;
            }

            if (addFeature)
            {
              sdFeatures.Add(sdFeature);
            }

          }
        }




        result = JsonConvert.SerializeObject(sdFeatures);
      }
      catch (Exception e)
      {
        Console.WriteLine(e.Message);
        return BadRequest(e);
      }

      return Ok(result);
    }

    [Route("downloadFeatures")]
    [HttpGet]
    public async Task<IActionResult> DownloadFeaturesAsync(string layerNums, string where, string featureName)
    {
      List<Dictionary<string, string>> featureDictionary = new List<Dictionary<string, string>>();
      int i = 0;
      var httpWhere = HttpUtility.UrlEncode(where);
      int[] nums = Array.ConvertAll(layerNums.Split(','), int.Parse);

      foreach (int layerNum in nums)
      {
        var url = String.Format("{2}/MapServer/{0}/query?where={1}&outFields=*" +
        "&returnGeometry=false&returnTrueCurves=false&outSR=&returnIdsOnly=false" +
        "&returnZ=false&returnM=false&returnDistinctValues=false&f=json", layerNum.ToString(), httpWhere, _domainUrl);

        var queryData = await GetResultAsync<Object>(url);

        foreach (var feature in queryData.features)
        {
          Dictionary<string, string> tempDictionary = new Dictionary<string, string>();

          foreach (var attribute in feature["attributes"])
          {
            tempDictionary.Add(attribute.Name, (string)attribute.Value);
          }


          if (tempDictionary.ContainsKey("Asset_Id"))
          {
            foreach (KeyValuePair<string, string> kvPair in await GetJdeData(tempDictionary["Asset_Id"]))
              if (kvPair.Key != "Asset_Id")
                tempDictionary.Add(kvPair.Key, kvPair.Value);
          }

          featureDictionary.Add(tempDictionary);
        }
      }

      using (var writer = new StringWriter())
      using (var csv = new CsvWriter(writer))
      {
        var records = new List<dynamic>();
        MemoryStream stream = new MemoryStream();
        StreamWriter streamWriter = new StreamWriter(stream);
        CsvWriter csvWriter = new CsvWriter(streamWriter);
        foreach (Dictionary<string, string> feature in featureDictionary)
        {
          var record = new ExpandoObject();
          foreach (KeyValuePair<string, string> kvPair in feature)
          {

            record.TryAdd(kvPair.Key, kvPair.Value);

          }
          records.Add(record);
        }
        csvWriter.WriteRecords(records);
        streamWriter.Flush();
        stream.Seek(0, SeekOrigin.Begin);
        return File(stream, "text/csv", $"{featureName}_{DateTime.Now.ToString("yyyy_MM_dd_HHmm")}.csv");
      }
    }

    [Route("getCCTVDataAsync")]
    [HttpGet]
    public async Task<string> GetCCTVDataAsync(string asset_Id)
    {
      var where = "ASSET_ID IN ('" + asset_Id + "')";
      var url = String.Format("{1}/Data_CCTV/MapServer/2/query?returnGeometry=false&where={0}&returnDistinctValues=false&outFields=*&spatialRel=esriSpatialRelIntersects&f=json", HttpUtility.UrlEncode(where), _domainUrlRoot);

      var cctv = await GetResultAsync<Object>(url);

      Dictionary<string, object> inspDictionary = new Dictionary<string, object>();

      foreach (var feature in cctv.features)
      {
        string objId = "";
        List<List<string>> cctvData = new List<List<string>>();
        foreach (var attribute in feature["attributes"])
        {
          if (attribute.Name == "OBJECTID")
            objId = attribute.Value;
          cctvData.Add(new List<string>() { attribute.Name, (string)attribute.Value });
        }
        inspDictionary.Add(objId, cctvData);
      }


      return JsonConvert.SerializeObject(inspDictionary);
    }

    [Route("getCCTVRelatedDataAsync")]
    [HttpGet]
    public async Task<string> GetCCTVRelatedDataAsync(string object_Id)
    {
      var url = String.Format("{1}/Data_CCTV/MapServer/2/queryRelatedRecords?outFields=*&objectIds={0}&returnGeometry=false&relationshipId=1&f=json", object_Id, _domainUrlRoot);

      var cctv = await GetResultAsync<Object>(url);

      Dictionary<string, object> inspDictionary = new Dictionary<string, object>();

      foreach (var records in cctv.relatedRecordGroups)
      {
        int i = 1;
        foreach (var record in records["relatedRecords"])
        {
          List<List<string>> cctvData = new List<List<string>>();
          foreach (var attribute in record["attributes"])
          {

            cctvData.Add(new List<string>() { attribute.Name, (string)attribute.Value });

          }
          inspDictionary.Add("Note " + i++, cctvData);
        }
      }


      return JsonConvert.SerializeObject(inspDictionary);
    }

    private List<Meta> CheckMetaAsync(List<Meta> metaData)
    {
      List<string> d = new List<string>();
      var dups = metaData.GroupBy(m => m.alias).Where(g => g.Count() > 1).ToList();

      foreach (var group in dups)
      {
        var groupKey = group.Key;
        var domainType = group.ElementAt(0).type;
        var meta = group.Where(g => g.domain.Count() >= 0).OrderByDescending(g => g.domain.Count()).FirstOrDefault();

        foreach (Meta mItem in group)
        {
          if (domainType != mItem.type)
          {
            //handle type difference here between same ALIAS. 
          }

          //if d has multiple list of domains, it will be merged together.
          if (mItem.domain.Count > 0)
            d.Add(JsonConvert.SerializeObject(mItem.domain, Formatting.None));

          metaData.Remove(mItem);
        }

        // no need to merge if only 1 item.
        if (d.Count > 1)
        {
          var domain = JsonUtils.MergeJSONArray(d);
          var domains = JsonConvert.DeserializeObject<List<Domain>>(domain.ToString());

          //Replacing domain with the merged list of domains
          meta.domain = domains;

          metaData.Add(meta);
        }
        else
        {

          metaData.Add(meta);
        }
      }

      return metaData;
    }

    private async Task<List<Meta>> ProcessMetaAsync(List<object> data)
    {
      bool codeValuesBlock = false;
      int i = 0;
      JArray tempJA = new JArray();
      List<Meta> layerMeta = new List<Meta>();
      StringBuilder sb = new StringBuilder();
      StringWriter sw = new StringWriter(sb);
      JsonWriter writer = new JsonTextWriter(sw);

      try
      {
        JObject jObj = JsonUtils.MergeJSON<object>(data);
        tempJA = (JArray)jObj["fields"];

        JsonReader reader = tempJA.CreateReader();
        await writer.WriteStartArrayAsync();

        while (reader.Read())
        {
          if (codeValuesBlock == false)
          {
            if (reader.Value != null)
            {
              if (reader.TokenType == JsonToken.PropertyName)
              {
                if (reader.Value.ToString() == "domain")
                {
                  codeValuesBlock = true;

                  if (jObj["fields"][i]["domain"].HasValues)
                  {
                    var something = "";
                    try
                    {
                      something = jObj["fields"][i]["domain"]["codedValues"].ToString();
                      await writer.WritePropertyNameAsync("domain");
                      await writer.WriteRawValueAsync(something);
                      await writer.WritePropertyNameAsync("range");
                    }
                    catch (NullReferenceException e)
                    {
                      await writer.WritePropertyNameAsync("range");
                      something = jObj["fields"][i]["domain"]["range"].ToString();
                      await writer.WriteRawValueAsync(something);
                      await writer.WritePropertyNameAsync("domain");
                    }

                    await writer.WriteStartArrayAsync();
                    await writer.WriteEndArrayAsync();
                    await writer.WriteEndObjectAsync();
                  }
                  else
                  {
                    await writer.WritePropertyNameAsync("domain");
                    await writer.WriteStartArrayAsync();
                    await writer.WriteEndArrayAsync();
                    await writer.WritePropertyNameAsync("range");
                    await writer.WriteStartArrayAsync();
                    await writer.WriteEndArrayAsync();
                    await writer.WriteEndObjectAsync();
                    codeValuesBlock = false;
                  }
                  i++;
                }
                else
                {
                  if (reader.Value.ToString() == "name")
                    await writer.WriteStartObjectAsync();

                  await writer.WritePropertyNameAsync(reader.Value.ToString());
                }
              }
              else
              {
                await writer.WriteValueAsync(reader.Value.ToString());
              }
            }
          }
          else
          {
            if (reader.Depth == 1)
              codeValuesBlock = false;
          }
        }
        await writer.WriteEndAsync();

        layerMeta = JsonConvert.DeserializeObject<List<Meta>>(sw.ToString());
        writer.Close();
      }
      catch (Exception e)
      {
        writer.Close();
      }
      //from appsettings.[env].json
      string[] excludesList = _config.GetSection("excludeFilters").Get<string[]>();
      layerMeta = layerMeta.Where(m => !excludesList.Any(e => e.ToLower() == m.name.ToLower())).ToList();
      return layerMeta;
    }

    private string formatDomainValue(string inputValue)
    {
      string outputValue = string.Empty;

      outputValue = inputValue.Replace('_', ' ').ToLower().Replace("bc ", "BC ").Replace("its ", "ITS ").Replace("cn ", "CN ");

      outputValue = CultureInfo.CurrentCulture.TextInfo.ToTitleCase(outputValue);

      return outputValue;
    }

    public IDictionary<string, string> GetValues(object obj)
    {
      return obj
              .GetType()
              .GetProperties()
              .ToDictionary(p => p.Name, p =>
              {
                if (p.GetValue(obj) != null)
                  return p.GetValue(obj).ToString();
                else
                  return "";
              });
    }

    public async Task<IDictionary<string, string>> GetJdeData(string asset_Id)
    {
      Dictionary<string, string> values = new Dictionary<string, string>();
      var fAssets = await _jdeContext.Fixed_Assets
          .Join(_jdeContext.FA_Additional,
          fa => fa.Fanumb,
          faa => faa.Wrnumb,
          (fa, faa) => new
          {
            Asset_Id = fa.Faasid.Trim(),
            Unit_Number = fa.Faapid.Trim(),
            Physical_Condition = faa.Wrze02.Trim(),
            Demand_Capacity = faa.Wrze03.Trim(),
            Functionality = faa.Wrze04.Trim(),
            LOS_group = fa.Faacl9.Trim(),
            Asset_class_AMP = fa.Faacl2.Trim(),
            Unit_CRV_noOH = String.Format("{0:C0}", fa.Faarpc / 100),
            Unit_Renew_cost_noOH = String.Format("{0:C0}", fa.Faalrc / 100),
            OH_Percentage = faa.Wrze09.Trim(),
            Criticality = fa.Faacl4.Trim(),
            Useful_Life = fa.Fafa9.Trim(),

          })
          .Where(fixedAsset => fixedAsset.Asset_Id == asset_Id)
          .ToListAsync();

      if (fAssets.Count > 0)
      {
        values = fAssets[0].GetType().GetProperties().Select(x =>
        new
        {
          property = x.Name,
          value = x.GetValue(fAssets[0], null)
        })
        .ToDictionary(x => x.property, y => y.value.ToString());
      }

      return values;
    }

    [Route("legends/{layerId}")]
    [HttpGet]
    public async Task<IActionResult> GetLegendsAsync(string layerId)
    {
      var url = _domainUrl + _config["appConfig:LegendsUrl"];
      var result = await GetResultAsync<LegendInfo>(url) as LegendInfo;
      if (result?.Layers?.Count > 0)
      {
        if (!string.IsNullOrEmpty(layerId))
        {
          result.Layers = result.Layers.FindAll(x => x.LayerId.ToString() == layerId);
        }
      }
      return Ok(result);
    }
  }
}
