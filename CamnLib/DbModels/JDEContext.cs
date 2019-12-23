using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Text;

namespace CamnLib.DbModels
{
  public class JDEContext : DbContext
  {
    public JDEContext(DbContextOptions options) : base(options)
    {

    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {

      modelBuilder.Entity<F1201>().ToTable("F1201");
      modelBuilder.Entity<F1217>().ToTable("F1217");
    }

    public DbSet<F1201> Fixed_Assets { get; set; }

    public DbSet<F1217> FA_Additional { get; set; }
  }
}
