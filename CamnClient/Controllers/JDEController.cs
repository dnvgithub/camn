using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using CamnLib.DbModels;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;

// For more information on enabling MVC for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace CamnClient.Controllers
{
  [Route("api/{controller}")]
  public class JDEController : BaseController
  {
    private readonly JDEContext _context;
    private IConfiguration _config;
    public JDEController(IConfiguration config, IHostingEnvironment env, JDEContext context) : base(config, env)
    {
      _context = context;
      _config = config;
    }

    [Route("getAssetConditionData")]
    [HttpGet]
    public async Task<string> GetAssetConditionData(string assetId)
    {

      try
      {
        var k1 = await _context.Fixed_Assets
          .Join(_context.FA_Additional,
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
          .Where(fixedAsset => fixedAsset.Asset_Id == assetId)
          .ToListAsync();

        if (k1.Count > 0)
        {
          var assets = GetValues(k1[0]);
          List<List<string>> additionalAssetData = new List<List<string>>();

          foreach (KeyValuePair<string, string> attr in assets)
          {
            if(attr.Key != "Asset_Id")
              additionalAssetData.Add(new List<string> { attr.Key, attr.Value });
          }

          return JsonConvert.SerializeObject(additionalAssetData);
        }
        else
          return JsonConvert.Null;
        
      }
      catch (Exception e)
      {
        return JsonConvert.Null;
      }
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
  }
}
