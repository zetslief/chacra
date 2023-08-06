using Microsoft.Extensions.FileProviders;
using System.Collections.Concurrent;
using Chacra;
using Microsoft.AspNetCore.Mvc;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

var loginPagePath = Path.GetFullPath("../ui/dist/login.html");
var lobbyBrowserHostPage = Path.GetFullPath("../ui/dist/lobby.browser.host.html");
var lobbyBrowserGuestPage = Path.GetFullPath("../ui/dist/lobby.browser.guest.html");
var indexPagePath = Path.GetFullPath("../ui/dist/index.html");

var lobbyStarted = false;
var players = new List<string>(); 
var inputQueue = new BlockingCollection<InputState>();

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

app.MapPost("/lobby/connect", (Connect connect) => {
    Console.WriteLine($"Connecting: {connect}");
    var playerName = connect.PlayerName;
    if (!string.IsNullOrEmpty(playerName)) {
        players.Add(playerName!);
        return Results.Redirect(players.Count == 1 
            ? "/lobby/browser/host" 
            : "/lobby/browser/guest"
        );
    } else {
        return Results.Redirect("/");
    }
});

app.MapGet("/lobby/browser/host", () => {
    return Results.Content(File.ReadAllText(lobbyBrowserHostPage), "text/html");
});

app.MapGet("/lobby/browser/guest", () => {
    return Results.Content(File.ReadAllText(lobbyBrowserGuestPage), "text/html");
});

app.MapGet("/lobby/data", () => {
    return Results.Json(players);
});

app.MapGet("/lobby/status", () => {
    return Results.Json(new LobbyStatus(lobbyStarted));
});

app.MapPost("/lobby/start", () => {
    lobbyStarted = true;
    return Results.Redirect("/game", true);
});

app.MapGet("/game", () => {
    return Results.Content(File.ReadAllText(indexPagePath), "text/html");
});

app.MapGet("/game/inputStates", () => {
    var currentQueue = inputQueue;
    inputQueue = new BlockingCollection<InputState>();
    return Results.Json(currentQueue.ToArray());
});


app.MapPost("/game/input", (InputState state) => {
    inputQueue.Add(state);
});

string state = string.Empty;
app.MapGet("/game/state", () => {
    var result = Results.Json(state);
    state = string.Empty;
    return result;
});

app.MapPost("/game/state", async (ctx) => {
    using var reader = new StreamReader(ctx.Request.Body);
    var body = await reader.ReadToEndAsync();
    state = body;
});

app.Run();

namespace Chacra {
    public record Connect(string PlayerName);
    public record Disconnect(string PlayerName);
    public record LobbyStatus(bool Started);
    public record InputState(string PlayerName, string Type, float Dx, float Dy);
}
