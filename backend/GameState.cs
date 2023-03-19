using System.Collections.Concurrent; 

public record Vec2(float X, float Y);
public record Point(float X, float Y): Vec2(X, Y);

public record Collider(float X, float Y, float Radius) : Point(X, Y);

public record Arena(float X, float Y, float Radius) : Point(X, Y);
public record Chakra(float X, float Y, Collider Collider) : Point(X, Y);
public record Enemy(float X, float Y, Point Target, Collider Collider) : Point(X, Y);

public enum AbilityType { Crown = 0, ThirdEye = 1 }
public abstract record Ability(bool Enabled, AbilityType Type);

public record GameState(Arena Arena, Chakra[] Chakras, List<Enemy> Enemies);

public class GameStateService
{
    const float COLLIDER_SIZE = 0.01f;
    const int CHAKRAS_COUNT = 7;
    const float CHAKRA_ARENA_SCALE = 0.9f;
    const float ARENA_X = 0.5f;
    const float ARENA_Y = 0.5f;
    const float ARENA_RADIUS = 0.45f;

    private readonly object sync = new();
    private GameState state = DefaultState();

    public ConcurrentQueue<Enemy> DeadEnemy { get; } = new();
    
    public void SetState(GameState state)
    {
        this.state = state;
    }
    
    public GameState GetState()
    {
        return this.state;
    }

    public void QueueKilledEnemy(Enemy enemy)
    {
        DeadEnemy.Enqueue(enemy);
    }

    public static GameState DefaultState() => new (
        new Arena(ARENA_X, ARENA_Y, ARENA_RADIUS),
        GenerateChakras(ARENA_X, ARENA_Y, ARENA_RADIUS * CHAKRA_ARENA_SCALE, CHAKRAS_COUNT),
        new List<Enemy>()
    );

    private static Chakra[] GenerateChakras(float posX, float posY, float radius, int count)
    {
        float angle = 0;
        var result = new Chakra[count];
        for(int chakraIndex = 0; chakraIndex < result.Length; ++chakraIndex)
        {
            var (sin, cos) = MathF.SinCos(angle);
            float x = posX;
            float y = posY;
            x += cos * radius;
            y += sin * radius;
            result[chakraIndex] = new(x, y, new Collider(x, y, COLLIDER_SIZE));
            angle += (2 * MathF.PI) / count;
        }
        return result;
    }
}
