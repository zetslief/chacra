using Chacra.State;

namespace Chacra;

public record BoosterDescription(string Name, string Color);

public static class BoosterFactory
{
    public static BoosterDescription BiggerPlayer { get; } = new("biggerPlayer", "purple");
    public static BoosterDescription BiggerBall { get; } = new("biggerBall", "lightgreen");
    public static BoosterDescription DeathBall { get; } = new("deathBall", "darkred");

    public const int BiggerPlayerChance = 40;
    public const int BiggerBallChance = 90;
    public const int DeathBallChance = 100;

    public static BoosterDescription[] All { get; } = GenerateBoosterDescriptions();

    public static BoosterState Create(int index, BoosterDescription description)
        => new(index, description.Name, description.Color);

    private static BoosterDescription[] GenerateBoosterDescriptions()
        => Enumerable.Range(0, 100).Select(index => index switch
        {
            < BiggerPlayerChance => BiggerPlayer,
            < BiggerBallChance => BiggerBall,
            < DeathBallChance => DeathBall,
            _ => throw new NotSupportedException("Chances greater than 100 does not exist :)"),
        }).ToArray();
}
