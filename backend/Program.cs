using Microsoft.Extensions.FileProviders;

var builder = WebApplication.CreateBuilder(args);

var loginPagePath = Path.GetFullPath("../ui/dist/login.html");
var connectedPagePath = Path.GetFullPath("../ui/dist/connected.html");
var indexPagePath = Path.GetFullPath("../ui/dist/index.html");

var players = new List<string>(); 

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(
        Path.Combine(builder.Environment.ContentRootPath, "../ui/dist/"))
});

app.MapGet("/", () => {
    return Results.Content(File.ReadAllText(loginPagePath), "text/html");
});

app.MapPost("/connect", async (ctx) => {
    var form = await ctx.Request.ReadFormAsync();
    if (form.TryGetValue("playerName", out var playerName)) {
        Console.WriteLine($"Player name: {playerName}");
        if (!string.IsNullOrEmpty(playerName)) {
            players.Add(playerName!);
            ctx.Response.Redirect("/connected");
        } else {
            ctx.Response.Redirect("/");
            throw new InvalidOperationException("Player name is empty!");
        }
    }
});

app.MapGet("/connected", () => {
    return Results.Content(File.ReadAllText(connectedPagePath), "text/html");
});

app.MapGet("/connected/data", () => {
    return Results.Json(players);
});

app.MapGet("/game", () => {
    return Results.Content(File.ReadAllText(loginPagePath), "text/html");
});

app.MapPost("/game/start", () => {
    return Results.Redirect("/game/started", true);
});

app.MapGet("/game/started", () => {
    return Results.Content(File.ReadAllText(indexPagePath), "text/html");
});

app.Run();

public record Connect(string PlayerName);
public record Disconnect(string PlayerName);
public record InputState(string PlayerName, bool? clicked, float Dx, float Dy);