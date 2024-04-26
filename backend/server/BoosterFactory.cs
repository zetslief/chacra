using Chacra.State;

namespace Chacra;

public record BoosterDescription(string Name, string Color);

public static class BoosterFactory
{
    public static BoosterDescription BiggerPlayer { get; } = new("biggerPlayer", "purple");
    public static BoosterDescription FasterPlayer { get; } = new("fasterPlayer", "yellow");
    public static BoosterDescription SlowerPlayer { get; } = new("slowerPlayer", "tan");
    public static BoosterDescription BiggerBall { get; } = new("biggerBall", "lightgreen");
    public static BoosterDescription FasterBall { get; } = new("fasterBall", "blue");
    public static BoosterDescription SlowerBall { get; } = new("slowerBall", "lightblue");
    public static BoosterDescription DeathBall { get; } = new("deathBall", "darkred");

    public const int BiggerPlayerChance = 25;
    public const int FasterPlayerChance = 40;
    public const int SlowerPlayerChance = 55;
    public const int BiggerBallChance = 65;
    public const int FasterBallChance = 80;
    public const int SlowerBallChance = 100;

    public static BoosterDescription[] All { get; } = GenerateBoosterDescriptions();

    public static BoosterState Create(int index, BoosterDescription description)
        => new(index, description.Name, description.Color);

    private static BoosterDescription[] GenerateBoosterDescriptions()
        => Enumerable.Range(0, 100).Select(index => index switch
        {
            < BiggerPlayerChance => BiggerPlayer,
            < FasterPlayerChance => FasterPlayer,
            < SlowerPlayerChance => SlowerPlayer,
            < BiggerBallChance => BiggerBall,
            < FasterBallChance => FasterBall,
            < SlowerBallChance => SlowerBall,
            _ => throw new NotSupportedException("Chances greater than 100 does not exist :)"),
        }).ToArray();
}
