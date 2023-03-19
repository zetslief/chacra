
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
        GameStateService gameStateService = serviceScope.ServiceProvider.GetService<GameStateService>()
            ?? throw new InvalidOperationException("Failed to get GameStateService");
        Console.WriteLine($"Clear database... {db.Enemies.Count()} enemies");
        ClearEnemies(db);
        int delay = 0;
        int lastMoveTime = 0;
        while(!stoppingToken.IsCancellationRequested)
        {
            GameState gameState = gameStateService.GetState(); 
            bool dbChanged = false;
            while (gameStateService.DeadEnemy.TryDequeue(out var enemy))
            {
                DeleteEnemy(db, enemy);
                dbChanged = true;
            }
            if (delay > 500)
            {
                if (gameState.Enemies.Count < 10)
                {
                    SpawnEnemy(db, gameState);
                    dbChanged = true;
                }
                lastMoveTime -= delay;
                delay = 0;
                continue;
            } 
            if (dbChanged)
            {
                db.SaveChanges();
            }
            delay += 10;
            await Task.Delay(10);
        }
    }

    private void SpawnEnemy(Database db, GameState state)
    {
        if (state.Chakras.Length == 0)
        {
            return;
        }
        int target = (int)(Random.Shared.NextDouble() * state.Chakras.Length);
        Chakra chakra = state.Chakras[target];
        float x = state.Arena.X;
        float y = state.Arena.Y;
        Console.WriteLine($"Spawn Enemy {x} {y}");
        state.Enemies.Add(new Enemy(x, y, chakra, new Collider(x, y, chakra.Collider.Radius)));
    }

    private void DeleteEnemy(Database db, Enemy enemy)
    {
        Console.WriteLine($"Delete Enemy ({enemy.X}, {enemy.Y})");
        var model = db.Enemies.First(e => e.X == enemy.X && e.Y == enemy.Y);
        db.Enemies.Remove(model);
    }

    private void ClearEnemies(Database db)
    {
        foreach(var enemy in db.Enemies)
        {
            db.Enemies.Remove(enemy);
        }
        db.SaveChanges();
    }
}
