public record Collider(float X, float Y, float Radius);
public record Chakra(float X, float Y, Collider Collider);
public record Arena(float X, float Y, float Radius);
public record GameState(Arena Arena, Chakra[] Chakras);

public class GameStateService
{
    const float COLLIDER_SIZE = 0.01f;
    const int CHAKRAS_COUNT = 7;
    const float ARENA_X = 0.5f;
    const float ARENA_Y = 0.5f;
    const float ARENA_RADIUS = 0.45f;

    private readonly object sync = new();
    private GameState state = DefaultState();
    
    public void SetState(GameState state)
    {
        this.state = state;
    }
    
    public GameState GetState()
    {
        return this.state;
    }

    public static GameState DefaultState() => new (
        new Arena(ARENA_X, ARENA_Y, ARENA_RADIUS),
        GenerateChakras(ARENA_X, ARENA_Y, ARENA_RADIUS, CHAKRAS_COUNT)
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