using Microsoft.Extensions.FileProviders;
using System.Collections.Concurrent;
using Chacra;

var builder = WebApplication.CreateBuilder(args);

var loginPagePath = Path.GetFullPath("./../../ui/dist/login.html");
var lobbyHostPage = Path.GetFullPath("./../../ui/dist/lobby.host.html");
var lobbyGuestPage = Path.GetFullPath("./../../ui/dist/lobby.guest.html");
var lobbyBrowserPage = Path.GetFullPath("./../../ui/dist/lobby.browser.html");
var indexPagePath = Path.GetFullPath("./../../ui/dist/index.html");

var games = new []
{
    new Game("tennis", 2),
};

var lobbyStarted = false;
LobbyData? lobby = null;
var inputQueue = new BlockingCollection<InputState>();
string state = string.Empty;

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

app.MapGet("/", GetMainPage);
app.MapGet("/lobbies/{playerName}", GetLobbyInformation);
app.MapGet("/lobbies/{lobbyId}/{playerName}/view", GetLobbyPage).WithName("get-host-page");
app.MapGet("/lobbies/{playerName}/view", GetLobbyBrowserPage).WithName("get-guest-page");
app.MapGet("/lobbies/{lobbyId}/{playerName}", GetLobbyData);
app.MapPut("/lobbies/{lobbyId}/{playerName}", RenameLobby);
app.MapPost("/lobbies", CreateLobby);
app.MapPost("/lobbies/{playerName}", PermissionToGoToGuestPage);
app.MapGet("/lobbies/{lobbyId}/join/players/{playerName}", GetPlayerJoinRequest).WithName("get-player-join-request");
app.MapPost("/lobbies/{lobbyId}/join/players/{playerName}", CreatePlayerJoinRequest);
app.MapGet("/lobbies/{lobbyId}/join/bots/{botName}", GetBotJoinRequest).WithName("get-bot-join-request");
app.MapPost("/lobbies/{lobbyId}/join/bots", CreateBotJoinRequest);
app.MapGet("/lobbies/{lobbyId}/players/{plyaerName}", GetPlayerInformation).WithName("get-player");
app.MapGet("/lobbies/{lobbyId}/bots/{botName}", GetBotInformation).WithName("get-bot");
app.MapPost("/lobbies/{lobbyId}/players", AddNewPlayer);
app.MapPost("/lobbies/{lobbyId}/bots", AddNewBot);
app.MapGet("/lobbies/status", GetLobbyStatus);
app.MapPost("/lobbies/start", StartLobby);
app.MapDelete("/lobbies/{lobbyId}/bots/{botName}", DeleteBot);
app.MapGet("/game", GetGame);
app.MapGet("/game/inputStates", GetInputStates);
app.MapPost("/game/input", PushInputState);
app.MapGet("/game/state", GetGameState);
app.MapPost("/game/state", UpdateGameStateAsync);

IResult GetMainPage()
    => Results.Content(File.ReadAllText(loginPagePath), "text/html");

LobbyInformation[] GetLobbyInformation(string playerName)
    => lobby is null
        ? Array.Empty<LobbyInformation>()
        : new LobbyInformation[] { new(lobby.Id, lobby.Name, lobby.Players.Count, lobby.Game) };

IResult GetLobbyPage(int lobbyId, string playerName)
    => lobby?.Id != lobbyId
        ? Results.NotFound("Lobby is not yet created")
        : lobby.Host.Name == playerName
            ?  Results.Content(File.ReadAllText(lobbyHostPage), "text/html")
            :  Results.Content(File.ReadAllText(lobbyGuestPage), "text/html");

IResult GetLobbyBrowserPage(string playerName)
    => Results.Content(File.ReadAllText(lobbyBrowserPage), "text/html");

IResult GetLobbyData(int lobbyId, string playerName)
    => lobby is null 
        ?  Results.BadRequest("Lobby is not created!")
        : lobby.Id == lobbyId 
            ? Results.Json(lobby)
            : Results.NotFound($"{lobbyId} lobby not found for {playerName} user");

IResult RenameLobby(int lobbyId, string playerName, RenameLobby rename)
{
    static IResult UpdateLobby(RenameLobby rename, LobbyData data, out LobbyData newData)
    {
        newData = data with { Name = rename.NewName };
        return Results.Ok();
    }

    return lobby is null
        ? Results.BadRequest("Lobby is not created yet")
        : lobby.Id == lobbyId
            ? lobby.Host.Name == playerName
                ? UpdateLobby(rename, lobby, out lobby)
                : Results.BadRequest("Only host is allowed to rename a lobby.")
            : Results.NotFound("Lobby is not found or player is not a host of this lobby.");
}

IResult CreateLobby(CreateLobby createLobby)
{
    var id = 1;
    lobby = new(id, createLobby.LobbyName, new Player(createLobby.PlayerName), games[0]);
    return Results.CreatedAtRoute("get-host-page", new {LobbyId = id, createLobby.PlayerName});
}

IResult PermissionToGoToGuestPage(string playerName)
    => Results.CreatedAtRoute("get-guest-page", new {playerName});

IResult GetPlayerJoinRequest(int lobbyId, string playerName) 
{
    if (lobby is null) return Results.NotFound("Lobby is not created yet!");
    if (lobby.Id != lobbyId) return Results.NotFound($"Lobby {lobbyId} is not found");
    var request = lobby.PlayerJoinRequests.FirstOrDefault(r => r.PlayerName == playerName);
    return request is null ? Results.NotFound() : Results.Json(request);
}

IResult GetBotJoinRequest(int lobbyId, string botName)
{
    if (lobby is null) return Results.NotFound("Lobby is not created yet!");
    if (lobby.Id != lobbyId) return Results.NotFound($"Lobby {lobbyId} is not found");
    var request = lobby.BotJoinRequests.FirstOrDefault(r => r.BotName == botName);
    return request is null ? Results.NotFound() : Results.Json(request);
}

IResult CreatePlayerJoinRequest(int lobbyId, string playerName)
{
    if (lobby is null) return Results.NotFound("Lobby is not created yet!");
    if (lobby.Id != lobbyId) return Results.NotFound($"Lobby {lobbyId} is not found");
    lobby.PlayerJoinRequests.Add(new(playerName));
    return Results.CreatedAtRoute("get-player-join-request", new {lobbyId, playerName});
}

IResult CreateBotJoinRequest(int lobbyId, BotJoinRequest request)
{
    if (lobby is null) return Results.NotFound("Lobby is not created yet!");
    if (lobby.Id != lobbyId) return Results.NotFound($"Lobby {lobbyId} is not found");
    lobby.BotJoinRequests.Add(request);
    return Results.CreatedAtRoute("get-bot-join-request", new {lobbyId, request.BotName});
}

IResult GetPlayerInformation(int lobbyId, string playerName)
{
    if (lobby is null) return Results.NotFound("Lobby is not created yet!");
    if (lobby.Id != lobbyId) return Results.NotFound($"Lobby {lobbyId} is not found");
    return lobby.Players.TryGetValue(new(playerName), out var player)
        ? Results.Json(player)
        : Results.NotFound($"{playerName} is not found in {lobbyId} lobby.");
}

IResult GetBotInformation(int lobbyId, string botName)
{
    if (lobby is null) return Results.NotFound("Lobby is not created yet!");
    if (lobby.Id != lobbyId) return Results.NotFound($"Lobby {lobbyId} is not found");
    return lobby.Bots.TryGetValue(new(botName), out var bot)
        ? Results.Json(bot)
        : Results.NotFound($"{botName} is not found in {lobbyId} lobby.");
}

IResult AddNewPlayer(int lobbyId, AddPlayer player)
{
    if (lobby is null) return Results.BadRequest("Lobby is not created");
    if (lobby.Id != lobbyId) return Results.BadRequest($"{lobbyId} lobby is not found!");
    if (lobby.Host.Name != player.PlayerName)
        return Results.BadRequest("Only host user is allowed to approve player join requests.");
    if (!lobby.PlayerJoinRequests.Remove(new(player.PlayerName)))
        return Results.NotFound($"{player.NewPlayer} player join request is not found.");
    if (lobby.Players.Contains(new(player.NewPlayer)))
        return Results.BadRequest($"{player.NewPlayer} is already in the lobby.");
    if (lobby.Bots.Count + lobby.Players.Count == lobby.Game.NumberOfPlayers)
        return Results.BadRequest("Too many players");
    lobby.Players.Add(new(player.NewPlayer));
    return Results.CreatedAtRoute("get-player", new {lobbyId, PlayerName=player.NewPlayer});
}

IResult AddNewBot(int lobbyId, AddBot bot)
{
    if (lobby is null) return Results.BadRequest("Lobby is not created");
    if (lobby.Id != lobbyId) return Results.BadRequest($"{lobbyId} lobby is not found!");
    if (lobby.Host.Name != bot.PlayerName)
        return Results.BadRequest("Only host user is allowed to approve bot join requests.");
    if (!lobby.BotJoinRequests.Remove(new(bot.BotName)))
        return Results.BadRequest($"{bot.BotName} bot join request is not found.");
    if (lobby.Bots.Contains(new(bot.BotName)))
        return Results.BadRequest($"{bot.BotName} is already in the lobby.");
    if (lobby.Bots.Count + lobby.Players.Count == lobby.Game.NumberOfPlayers)
        return Results.BadRequest("Too many players");
    lobby.Bots.Add(new(bot.BotName));
    return Results.CreatedAtRoute("get-bot", new {lobbyId, bot.BotName});
}

IResult GetLobbyStatus()
    => Results.Json(new LobbyStatus(lobbyStarted));

IResult StartLobby()
{
    lobbyStarted = true;
    return Results.Redirect("/game", true);
}

IResult DeleteBot(int lobbyId, string botName)
{
    if (lobby is null) return Results.BadRequest("Lobby is not created");
    if (lobby.Id != lobbyId) return Results.BadRequest($"Lobby is not found!");
    lobby.Bots.Remove(new(botName));
    return Results.Ok();
}

IResult GetGame()
    => Results.Content(File.ReadAllText(indexPagePath), "text/html");

IResult GetInputStates()
{
    var currentQueue = inputQueue;
    inputQueue = new BlockingCollection<InputState>();
    return Results.Json(currentQueue.ToArray());
}

void PushInputState(InputState state)
    => inputQueue.Add(state);

IResult GetGameState()
{
    var result = Results.Json(state);
    state = string.Empty;
    return result;
}

async Task UpdateGameStateAsync(HttpContext ctx)
{
    using var reader = new StreamReader(ctx.Request.Body);
    var body = await reader.ReadToEndAsync().ConfigureAwait(false);
    state = body;
}

app.Run();

namespace Chacra {
    public record CreateLobby(string LobbyName, string PlayerName);
    public record RenameLobby(string NewName);
    public record JoinLobby(string LobbyName, string PlayerName);
    public record LobbyStatus(bool Started);
    public record PlayerJoinRequest(string PlayerName);
    public record BotJoinRequest(string BotName);
    public record AddPlayer(string PlayerName, string NewPlayer);
    public record AddBot(string PlayerName, string BotName);
    public record DeleteBot(string LobbyName, string Name);

    public record LobbyData(
        int Id,
        string Name,
        Player Host,
        Game Game,
        HashSet<Player> Players,
        HashSet<Bot> Bots,
        HashSet<PlayerJoinRequest> PlayerJoinRequests,
        HashSet<BotJoinRequest> BotJoinRequests)
    {
        public LobbyData(int id, string name, Player host, Game game)
            : this(id, name, host, game, new() { host }, new(), new(), new()) { }
    }

    public record LobbyInformation(int Id, string Name, int CurrentNumberOfPlayers, Game game);

    public record InputState(string PlayerName, string Type, float Dx, float Dy);

    public record Player(string Name);
    public record Bot(string Name);
    public record Game(string Name, int NumberOfPlayers);
}
