public class GameLoopService : BackgroundService
{
    private readonly IServiceScopeFactory serviceScopeFactory;

    public GameLoopService(IServiceScopeFactory serviceScopeFactory)
    {
        this.serviceScopeFactory = serviceScopeFactory;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var serviceScope = serviceScopeFactory.CreateScope();
        Database db = serviceScope.ServiceProvider.GetService<Database>()
            ?? throw new InvalidOperationException("Failed to get database!");
        Console.WriteLine($"Clear database... {db.Enemies.Count()} enemies");
        ClearEnemies(db);
        int delay = 0;
        while(!stoppingToken.IsCancellationRequested)
        {
            if (delay > 500)
            {
                if (db.Enemies.Count() < 10)
                {
                    Console.WriteLine("create enemy");
                    SpawnEnemy(db);
                }
                delay = 0;
            } 
            else
            {
                delay += 10;
            }
            await Task.Delay(10);
        }
    }

    private void SpawnEnemy(Database db)
    {
        float x = 1000;
        float y = 500;
        CircleCollider collider = new() { X = x, Y = y, Radius = 10 };
        db.Enemies.Add(new EnemyModel() { 
            X = x,
            Y = y,
            Collider = collider 
        });
        db.SaveChanges();
    }

    private void ClearEnemies(Database db)
    {
        foreach(var enemy in db.Enemies)
        {
            db.Enemies.Remove(enemy);
        }
        db.SaveChangesAsync();
    }
}