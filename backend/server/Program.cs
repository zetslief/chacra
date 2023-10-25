using Microsoft.Extensions.FileProviders;
using System.Collections.Concurrent;
using Chacra;

var builder = WebApplication.CreateBuilder(args);

var loginPagePath = Path.GetFullPath("./../../ui/dist/login.html");
var lobbyBrowserHostPage = Path.GetFullPath("./../../ui/dist/lobby.browser.host.html");
var lobbyBrowserGuestPage = Path.GetFullPath("./../../ui/dist/lobby.browser.guest.html");
var indexPagePath = Path.GetFullPath("./../../ui/dist/index.html");

var games = new []
{
    new Game("tennis", 2),
};

var lobbyStarted = false;
LobbyData? lobby = null;
var inputQueue = new BlockingCollection<InputState>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(
        Path.Combine(builder.Environment.ContentRootPath, "./../../ui/dist/"))
});

app.MapGet("/", () => {
    return Results.Content(File.ReadAllText(loginPagePath), "text/html");
});

app.MapPost("/lobby/join", (JoinLobby joinLobby) => {
    Console.WriteLine($"Join lobby: {joinLobby}");
    var newPlayer = new Player(joinLobby.PlayerName);
    if (lobby is null)
    {
        Console.WriteLine($"Error: lobby not created");
        return Results.BadRequest("Failed to join lobby: not found!");
    }
    if (!lobby.Players.Contains(newPlayer))
    {
        lobby.Players.Add(newPlayer);
    }
    return lobby.Host == newPlayer ?  Results.Redirect("/lobby/host") : Results.Redirect("/lobby/host");
});

app.MapPost("/lobby/create", (CreateLobby createLobby) =>
{
    lobby = new(createLobby.LobbyName, new Player(createLobby.PlayerName), games[0]);
    return Results.Redirect("/lobby/host");
});

app.MapPost("/lobby/rename", (RenameLobby rename) =>
{
    if (lobby is null) {
        return Results.BadRequest("Lobby not created");
    } else {
        lobby = lobby with { Name = rename.NewName };
        return Results.Ok();
    }
});

app.MapGet("/lobby/host", () => {
    return Results.Content(File.ReadAllText(lobbyBrowserHostPage), "text/html");
});

app.MapGet("/lobby/guest", () => {
    return Results.Content(File.ReadAllText(lobbyBrowserGuestPage), "text/html");
});

app.MapGet("/lobby/data", () => {
    return lobby is null
        ? Results.BadRequest("Lobby is not created!")
        : Results.Json(lobby);
});

app.MapGet("/lobby/status", () => {
    return Results.Json(new LobbyStatus(lobbyStarted));
});

app.MapPost("/lobby/start", () => {
    lobbyStarted = true;
    return Results.Redirect("/game", true);
});

app.MapPost("/lobby/bot/add", (AddBot bot) => {
    if (lobby is null) return Results.BadRequest("Lobby is not created");
    if (lobby.Name != bot.LobbyName) return Results.BadRequest($"{bot.LobbyName} lobby is not found!");
    lobby.Bots.Add(new(bot.Name));
    return Results.Ok();
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
    public record CreateLobby(string LobbyName, string PlayerName);
    public record RenameLobby(string CurrentName, string NewName);
    public record JoinLobby(string LobbyName, string PlayerName);
    public record LobbyStatus(bool Started);
    public record AddBot(string LobbyName, string Name);

    public record LobbyData(string Name, Player Host, Game Game, HashSet<Player> Players, HashSet<Bot> Bots)
    {
        public LobbyData(string name, Player host, Game game)
            : this(name, host, game, new() { host }, new()) { }
    }

    public record InputState(string PlayerName, string Type, float Dx, float Dy);

    public record Player(string Name);
    public record Bot(string Name);
    public record Game(string Name, int NumberOfPlayers);
}
