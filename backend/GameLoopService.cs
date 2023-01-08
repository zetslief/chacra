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
            if (delay > 500)
            {
                if (gameState.Enemies.Count < 10)
                {
                    Console.WriteLine("create enemy");
                    SpawnEnemy(db, gameState);
                }
                lastMoveTime -= delay;
                delay = 0;
                continue;
            } 
            if (delay - lastMoveTime > 16)
            {
                float dt = delay - lastMoveTime;
                MoveEnemies(gameState.Enemies, dt);
                CheckForCollisions(gameState.Chakras, gameState.Enemies);
                lastMoveTime = delay;
            }
            delay += 10;
            await Task.Delay(10);
        }
    }

    private void MoveEnemies(List<Enemy> enemies, float dt)
    {
        for(int enemyIndex = 0; enemyIndex < enemies.Count; ++enemyIndex)
        {
            var enemy = enemies[enemyIndex];
            const float ENEMY_SPEED = 0.0002f;
            Vec2 direction = Direction(enemy, enemy.Target);
            float x = enemy.X + ENEMY_SPEED * direction.X * dt;
            float y = enemy.Y + ENEMY_SPEED * direction.Y * dt;
            enemies[enemyIndex] = new Enemy(x, y, enemy.Target, new Collider(x, y, enemy.Collider.Radius));
        }
    }

    private static float Distance(Position a, Position b)
    {
        float dx = a.X - b.X;
        float dy = a.Y - b.Y;
        return MathF.Sqrt(dx * dx + dy * dy);
    }

    private static Vec2 Direction(Position from, Position to)
    {
        float dx = to.X - from.X;
        float dy = to.Y - from.Y;
        float length = MathF.Sqrt(dx * dx + dy * dy);
        return new Vec2(dx / length, dy / length);
    }

    private bool Collide(Collider first, Collider second)
    {
        float distance = Distance(first, second);
        return distance < (first.Radius + second.Radius);
    }

    private void CheckForCollisions(Chakra[] chakras, List<Enemy> enemies)
    {
        foreach(var chakra in chakras)
        {
            for(int enemyIndex = 0; enemyIndex < enemies.Count; ++enemyIndex)
            {
                Enemy enemy = enemies[enemyIndex];
                if (Collide(chakra.Collider, enemy.Collider))
                {
                    enemies.Remove(enemy);
                    --enemyIndex;
                }
            }
        }
    }

    private void SpawnEnemy(Database _db, GameState state)
    {
        if (state.Chakras.Length == 0)
        {
            return;
        }
        int target = (int)(Random.Shared.NextDouble() * state.Chakras.Length);
        Chakra chakra = state.Chakras[target];
        float x = state.Arena.X;
        float y = state.Arena.Y;
        state.Enemies.Add(new Enemy(x, y, chakra, new Collider(x, y, chakra.Collider.Radius)));
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