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
        while(!stoppingToken.IsCancellationRequested)
        {
            if (delay > 500)
            {
                if (db.Enemies.Count() < 10)
                {
                    Console.WriteLine("create enemy");
                    SpawnEnemy(db, gameStateService.GetState());
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

    private void SpawnEnemy(Database db, GameState state)
    {
        if (state.Charas.Length == 0)
        {
            return;
        }
        int target = (int)(Random.Shared.NextDouble() * state.Charas.Length);
        Chakra chakra = state.Charas[target];
        float x = state.Arena.X;
        float y = state.Arena.Y;
        db.Enemies.Add(new EnemyModel() { 
            X = x,
            Y = y,
            TargetX = chakra.X,
            TargetY = chakra.Y,
            Collider = new() { X = x, Y = y, Radius = 10 }
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