using System;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;

using CamnLib;
using CamnLib.DbModels;

namespace CamnClient.Controllers
{
  [Authorize]
  [Route("api/{controller}")]
  public class LoggingController : Controller
  {
    private readonly InMemoryLog _inMemoryLog;

    [HttpPost("[action]")]
    public IActionResult ClientActionLog([FromBody]UserAction action)
    {
      try
      {
        action.userName = this.User.Identity.Name;
        _inMemoryLog.Log(action);
      }
      catch (Exception e)
      {
        return StatusCode(Microsoft.AspNetCore.Http.StatusCodes.Status500InternalServerError, e);
      }

      return Ok();
    }

    public LoggingController(InMemoryLog inMemoryLog)
    {
      _inMemoryLog = inMemoryLog;
    }
  }
}
