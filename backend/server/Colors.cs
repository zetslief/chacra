namespace Chacra.Colors;

public static class Colors
{
    private static readonly Random random = new();
    private static readonly string[] colors = new []
    {
        "indianred",
        "lightblue",
        "lightgreen",
        "fuchsia"
    };

    public static int NumberOfColors => colors.Length;

    public static string GetRandomColor()
        => colors[random.Next(colors.Length)];
}
