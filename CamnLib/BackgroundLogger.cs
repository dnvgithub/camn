using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.EntityFrameworkCore;

using CamnLib.DbModels;

// From:
// https://docs.microsoft.com/en-us/aspnet/core/fundamentals/host/hosted-services?view=aspnetcore-2.2&tabs=visual-studio

namespace CamnLib
{

  public class BackgroundLogger : IHostedService, IDisposable
  {
    private readonly IConfiguration _config;
    private readonly InMemoryLog _inMemoryLog;
    private Timer _timer;

    public BackgroundLogger(IConfiguration config, InMemoryLog inMemoryLog)
    {
      _config = config;
      _inMemoryLog = inMemoryLog;
    }

    public Task StartAsync(CancellationToken cancellationToken)
    {

      _timer = new Timer(DoWork, null, TimeSpan.Zero,
          TimeSpan.FromSeconds(5));

      return Task.CompletedTask;
    }

    private void DoWork(object state)
    {
      if (!_inMemoryLog.IsEmpty())
      {
        Task.Run(async () =>
        {
          DbContextOptionsBuilder optionsBuilder = new DbContextOptionsBuilder<CamnContext>();
          optionsBuilder.UseSqlServer(_config.GetConnectionString("CamnContextWriter"));

          CamnContext camnContext = new CamnContext(optionsBuilder.Options);
          while (!_inMemoryLog.IsEmpty())
          {
            UserAction action = _inMemoryLog.Get();
            if (null != action)
            {
              await camnContext.UserActions.AddAsync(action);
            }
          }
          await camnContext.SaveChangesAsync();
        }).Wait();
      }
    }

    public Task StopAsync(CancellationToken cancellationToken)
    {
      _timer?.Change(Timeout.Infinite, 0);

      return Task.CompletedTask;
    }

    public void Dispose()
    {
      _timer?.Dispose();
    }
  }
}
