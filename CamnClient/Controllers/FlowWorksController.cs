using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using CamnLib.DbModels;
using CamnLib.JsonModels;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;

// For more information on enabling MVC for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace CamnClient.Controllers
{
  [Route("api/{controller}")]
  public class FlowWorksController : BaseController
  {
    private readonly IConfiguration _config;

    [Route("getFlowWorksData")]
    [HttpGet]
    public async Task<string> GetFlowWorksData(int stationId)
    {
      var url = this._config["flowWorksApiUrl"] + this._config["FlowWorksApiKey"] + "/site/" + stationId;

      SiteChannels siteChannels = await GetResultAsync<SiteChannels>(url);
      var filterChannels = _config.GetSection("channels").Get<List<string>>();

      List<Channel> channels = siteChannels.sites[0].channels.Where(s => filterChannels.Contains(s.name)).ToList<Channel>();

      List<List<string>> tempChannelData = new List<List<string>>();

      foreach (Channel channel in channels)
      {
        url = this._config["flowWorksApiUrl"] + this._config["flowWorksApiKey"] + "/site/" + stationId + "/channel/" + channel.id + "/data/intervaltype/D/intervalnum/1";
        ChannelData tempData = await GetResultAsync<ChannelData>(url);

        if (tempData.datapoints.Count > 0)
        {
          tempChannelData.Add(new List<string>
          {
            channel.name
            , tempData.datapoints.OrderByDescending(d => d.date).FirstOrDefault().value.ToString() + " " + channel.unit + ", "
            + (tempData.datapoints.OrderByDescending(d => d.date).FirstOrDefault().date.DayOfYear == DateTime.Today.DayOfYear ? "today @ " + tempData.datapoints.OrderByDescending(d => d.date).FirstOrDefault().date.ToShortTimeString() :
            "yesterday @ " + tempData.datapoints.OrderByDescending(d => d.date).FirstOrDefault().date.ToShortTimeString())
          });
        }
      }

      return JsonConvert.SerializeObject(tempChannelData);
    }

    public FlowWorksController(IConfiguration config, IHostingEnvironment env) : base(config, env)
    {
      _config = config;
    }
  }
}
