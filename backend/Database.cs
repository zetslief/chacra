using System.ComponentModel.DataAnnotations;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

public class Database : DbContext
{
    public DbSet<EnemyModel> Enemies { get; set; } = null!;

    protected override void OnConfiguring(DbContextOptionsBuilder configuration)
    {
        var connectionStringBuilder = new SqliteConnectionStringBuilder()
        {
            DataSource = "Chacra.sqlite"
        };
        string connectionString = connectionStringBuilder.ToString();
        var connection = new SqliteConnection(connectionString);
        configuration.UseSqlite(connection);
    }
} 

public interface IPosition
{
    public float X { get; set; }
    public float Y { get; set; }
}

public interface ICollider : IPosition
{
}

public class CircleCollider : ICollider
{
    public int Id { get; set; }
    public float X { get; set; }
    public float Y { get; set; }
    public float Radius { get; set; }
}

public class EnemyModel : IPosition
{
    public int Id { get; set ;}

    public float X { get; set; }
    public float Y { get; set; }

    [Required]
    public CircleCollider? Collider { get; set; }
}