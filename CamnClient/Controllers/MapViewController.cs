using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

using Microsoft.EntityFrameworkCore;


using System;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

using CamnLib.DbModels;

// TODO check csrf
// TODO validate the application field

namespace CamnClient.Controllers
{
  [Authorize]
  [Route("api/{controller}")]
  public class MapViewController : Controller
  {
    private readonly CamnContext _camnContext;

    [HttpGet("[action]/{application}")]
    public async Task<IActionResult> MapViews(string application)
    {
      List<MapView> mapViews;
      try
      {
        mapViews = await _camnContext.MapViews.Where(
          mapView => (mapView.UserName == User.Identity.Name) && (mapView.Application == application)
          )
          .OrderBy(mapView => mapView.BookmarkName)
          .ToListAsync();
      }
      catch (Exception e)
      {
        return StatusCode(Microsoft.AspNetCore.Http.StatusCodes.Status500InternalServerError, e);
      }

      return Ok(mapViews);
    }

    [HttpGet("[action]/{shareId}")]
    public async Task<IActionResult> MapViewOpenShared(string shareId)
    {
      List<MapView> mapViews;
      try
      {
        mapViews = await _camnContext.MapViews.Where(
          mapView => (mapView.ShareId == shareId)
          )
          .ToListAsync();
      }
      catch (Exception e)
      {
        return StatusCode(Microsoft.AspNetCore.Http.StatusCodes.Status500InternalServerError, e);
      }

      return Ok(mapViews);
    }

    // Save a new instance of MapView
    [HttpPost("[action]")]
    public async Task<IActionResult> MapViewSaveAs([FromBody]MapView value)
    {
      MapView mapView = new MapView();
      try
      {
        mapView.UserName = this.User.Identity.Name;
        mapView.BookmarkName = value.BookmarkName;
        mapView.Application = value.Application;
        mapView.Data = value.Data;
        mapView.Timestamp = DateTime.Now;
        mapView.ShareId = Guid.NewGuid().ToString();
        await _camnContext.MapViews.AddAsync(mapView);
        await _camnContext.SaveChangesAsync();
      }
      catch (Exception e)
      {
        return StatusCode(Microsoft.AspNetCore.Http.StatusCodes.Status500InternalServerError, e);
      }

      return Ok(mapView);
    }


    // Save an existing MapView
    [HttpPost("[action]")]
    public async Task<IActionResult> MapViewSave([FromBody]MapView value)
    {
      MapView mapView;
      try
      {
        value.UserName = this.User.Identity.Name;
        mapView = await _camnContext.MapViews
          .FirstOrDefaultAsync<MapView>(
          view => (view.UserName == value.UserName) && (view.Application == value.Application) && (view.Id == value.Id)
          );

        if (null == mapView)
        {
          return StatusCode(Microsoft.AspNetCore.Http.StatusCodes.Status400BadRequest);
        }
        else
        {
          mapView.Timestamp = DateTime.Now;
          mapView.Data = value.Data;
        }

        await _camnContext.SaveChangesAsync();

      }
      catch (Exception e)
      {
        return StatusCode(Microsoft.AspNetCore.Http.StatusCodes.Status500InternalServerError, e);
      }

      return Ok(mapView);
    }

    // Delete an existing MapView
    [HttpPost("[action]")]
    public async Task<IActionResult> MapViewDelete([FromBody]MapView value)
    {
      try
      {
        await _camnContext.Database.ExecuteSqlCommandAsync(
          "DELETE FROM [dbo].[MAPVIEW] WHERE [ID] = {0} AND [USER_NAME] = {1} AND [APPLICATION] = {2}",
          value.Id,
          this.User.Identity.Name,
          value.Application
          );
      }
      catch (Exception e)
      {
        return StatusCode(Microsoft.AspNetCore.Http.StatusCodes.Status500InternalServerError, e);
      }

      return Ok();
    }




    [HttpGet("[action]/{application}")]
    public async Task<IActionResult> DefaultMapView(string application)
    {
      try
      {
        DefaultMapView value = new DefaultMapView();
        value.UserName = this.User.Identity.Name;
        value.Application = application;
        DefaultMapView defaultMapView = await GetDefaultMapView(value);
        MapView mapView = null;
        if (null != defaultMapView)
        {
          mapView = new MapView();
          mapView.Id = defaultMapView.MapViewId;
        }
        return Ok(mapView); // null -> 204 No Content
      }
      catch (Exception e)
      {
        return StatusCode(Microsoft.AspNetCore.Http.StatusCodes.Status500InternalServerError, e);
      }
    }

    [HttpPost("[action]")]
    public async Task<IActionResult> DefaultMapViewSave([FromBody]MapView value)
    {
      DefaultMapView newDefaultMapView;
      try
      {
        newDefaultMapView = new DefaultMapView();
        newDefaultMapView.UserName = this.User.Identity.Name;
        newDefaultMapView.Application = value.Application;
        newDefaultMapView.MapViewId = value.Id;

        DefaultMapView existingDefaultMapView = await GetDefaultMapView(newDefaultMapView);

        if (null == existingDefaultMapView)
        {
          await _camnContext.DefaultMapViews.AddAsync(newDefaultMapView);
          newDefaultMapView.Timestamp = DateTime.Now;
        }
        else
        {
          existingDefaultMapView.MapViewId = value.Id;
          existingDefaultMapView.Timestamp = DateTime.Now;
        }
        await _camnContext.SaveChangesAsync();
      }
      catch (Exception e)
      {
        return StatusCode(Microsoft.AspNetCore.Http.StatusCodes.Status500InternalServerError, e);
      }

      return Ok(value);
    }

    [HttpPost("[action]")]
    public async Task<IActionResult> DefaultMapViewDelete([FromBody]MapView value)
    {
      try
      {
        await _camnContext.Database.ExecuteSqlCommandAsync(
          "DELETE FROM [dbo].[DEFAULT_MAPVIEW] WHERE [USER_NAME] = {0} AND [APPLICATION] = {1}",
          this.User.Identity.Name,
          value.Application
          );
      }
      catch (Exception e)
      {
        return StatusCode(Microsoft.AspNetCore.Http.StatusCodes.Status500InternalServerError, e);
      }

      return Ok();
    }

    private Task<DefaultMapView> GetDefaultMapView(DefaultMapView value)
    {
      return _camnContext.DefaultMapViews
          .FirstOrDefaultAsync<DefaultMapView>(
          d => (d.UserName == value.UserName) && (d.Application == value.Application)
          );
    }

    public MapViewController(CamnContext camnContext)
    {
      _camnContext = camnContext;
    }
  }
}
