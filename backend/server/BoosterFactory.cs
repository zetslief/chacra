using Chacra.State;

namespace Chacra;

public record BoosterDescription(string Name, string Color);

public static class BoosterFactory
{
    public static BoosterDescription BiggerPlayer { get; } = new("biggerPlayer", "purple");
    public static BoosterDescription BiggerBall { get; } = new("biggerBall", "lightgreen");
    public static BoosterDescription Obstacle { get; } = new("obstacle", "white");

    public static BoosterDescription[] All { get; } = [
        BiggerPlayer,
        BiggerBall,
        Obstacle,
    ];

    public static BoosterState Create(int index, BoosterDescription description)
        => new(index, description.Name, description.Color);
}
