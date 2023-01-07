public record Collider(float X, float Y, float Radius);
public record Chakra(float X, float Y, Collider Collider);
public record Arena(float X, float Y);
public record GameState(Arena Arena, Chakra[] Charas);

public class GameStateService
{
    private readonly object sync = new();
    private GameState state = new(new Arena(0, 0), new Chakra[0]);
    
    public void SetState(GameState state)
    {
        this.state = state;
    }
    
    public GameState GetState()
    {
        return this.state;
    }
}