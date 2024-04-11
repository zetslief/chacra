using Chacra.State;

namespace Chacra;

public record BoosterDescription(string Name, string Color, int Chance);

public static class BoosterFactory
{
    public static BoosterDescription BiggerPlayer { get; } = new("biggerPlayer", "purple", 40);
    public static BoosterDescription BiggerBall { get; } = new("biggerBall", "lightgreen", 30);
    public static BoosterDescription Obstacle { get; } = new("obstacle", "white", 20);

    public static BoosterDescription[] All { get; } = [
        BiggerPlayer,
        BiggerBall,
        Obstacle,
    ];

    public static BoosterState Create(int index, BoosterDescription description)
        => new(index, description.Name, description.Color, description.Chance);
}
