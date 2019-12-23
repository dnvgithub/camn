using Microsoft.EntityFrameworkCore;

namespace CamnLib.DbModels
{
  public class CamnContext : DbContext
  {
    public CamnContext(DbContextOptions options) : base(options)
    {

    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {

      modelBuilder.Entity<Layer>().ToTable("Layer");
      modelBuilder.Entity<FeatureLayer>().ToTable("Layer_Feature");
      modelBuilder.Entity<Basemap>().ToTable("Basemap");
      modelBuilder.Entity<UserAction>().ToTable("UserAction");
      modelBuilder.Entity<MapView>().ToTable("MAPVIEW");
      modelBuilder.Entity<DefaultMapView>().ToTable("DEFAULT_MAPVIEW");
      modelBuilder.Entity<FlowWorksSite>().ToTable("Flowworks_Site");
      modelBuilder.Entity<LayerFeatureVersion>().ToTable("Layer_Feature_Version");
    }

    public DbSet<Layer> Layers { get; set; }

    public DbSet<FeatureLayer> Layer_Features { get; set; }

    public DbSet<Basemap> Basemaps { get; set; }

    public DbSet<UserAction> UserActions { get; set; }

    public DbSet<MapView> MapViews { get; set; }
    public DbSet<DefaultMapView> DefaultMapViews { get; set; }

    public DbSet<FlowWorksSite> Flowworks_Site { get; set; }

    public DbSet<LayerFeatureVersion> Layer_Feature_Version { get; set; }
  }
}
