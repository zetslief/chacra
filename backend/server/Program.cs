using Microsoft.Extensions.FileProviders;
using System.Collections.Concurrent;
using System.Text.Json.Serialization;

using Chacra;

var builder = WebApplication.CreateBuilder(args);

var loginPagePath = Path.GetFullPath("./../../ui/dist/login.html");
var lobbyHostPage = Path.GetFullPath("./../../ui/dist/lobby.host.html");
var lobbyGuestPage = Path.GetFullPath("./../../ui/dist/lobby.guest.html");
var lobbyBrowserPage = Path.GetFullPath("./../../ui/dist/lobby.browser.html");
var indexPagePath = Path.GetFullPath("./../../ui/dist/index.html");
var playerGamePagePath = indexPagePath;

var lobbyMessages = new ConcurrentQueue<(string Sender, Message Content)>();
var sentMessagesMap = new ConcurrentDictionary<string, int>();

var games = new []
{
    new Game("tennis", 2),
};

var lobbyStarted = false;
LobbyData? lobby = null;
Dictionary<string, BlockingCollection<State>> inputQueue = new();
var entity = new Entity((s) => PushState(s));

builder.Services.AddHostedService<Entity>((p) => entity);
builder.Services.AddSingleton(entity.Writer);

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

// Lobby API.
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
app.MapGet("/lobbies/{lobbyId}/players/{playerName}", GetPlayerInformation).WithName("get-player");
app.MapGet("/lobbies/{lobbyId}/bots/{botName}", GetBotInformation).WithName("get-bot");
app.MapPost("/lobbies/{lobbyId}/players", AddNewPlayer);
app.MapPost("/lobbies/{lobbyId}/bots", AddNewBot);
app.MapGet("/lobbies/{lobbyId}/messages/{playerName}", GetNewMessages);
app.MapPost("/lobbies/{lobbyId}/messages/{playerName}", AddMessage);
app.MapGet("/lobbies/status", GetLobbyStatus);
app.MapPost("/lobbies/start/{playerName}", StartLobby);
app.MapDelete("/lobbies/{lobbyId}/bots/{botName}", DeleteBot);
app.MapDelete("/lobbies/{lobbyId}/players/{playerName}", DeletePlayer);

// Game API
app.MapGet("/game/{playerName}", GetGame);
app.MapGet("/game/inputStates/{playerName}", GetInputStates);
app.MapPost("/game/input", PushInputState);
app.MapPost("/game/finished", PushGameFinished);

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

IResult CreateLobby(CreateLobby createLobby, EntityWriter writer)
{
    var id = 1;
    lobby = new(id, createLobby.LobbyName, new Player(createLobby.PlayerName), games[0]);
    lobbyStarted = false;
    writer.GameFinished();
    inputQueue.Clear();
    return Results.CreatedAtRoute("get-host-page", new {LobbyId = id, createLobby.PlayerName});
}

IResult PermissionToGoToGuestPage(string playerName)
    => Results.CreatedAtRoute("get-guest-page", new {playerName});

IResult GetPlayerJoinRequest(int lobbyId, string playerName) 
{
    if (lobby is null) return Results.NotFound("Lobby is not created yet!");
    if (lobby.Id != lobbyId) return Results.NotFound($"Lobby {lobbyId} is not found");
    var request = lobby.PlayerJoinRequests.FirstOrDefault(r => r.PlayerName == playerName);
    return request is null 
        ? lobby.Players.Contains(new(playerName)) 
            ? Results.Json(new PlayerJoinRequestInformation(playerName, true)) 
            : Results.NotFound() 
        : Results.Json(new PlayerJoinRequestInformation(playerName, false));
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
    if (!lobby.PlayerJoinRequests.Remove(new(player.NewPlayer)))
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

IResult GetNewMessages(string lobbyId, string playerName) {
    if (!sentMessagesMap.TryGetValue(playerName, out var lastSentIndex)) {
        lastSentIndex = 0;
    }
    var messages = lobbyMessages.Skip(lastSentIndex).ToArray();
    sentMessagesMap.AddOrUpdate(playerName, messages.Length, (k, v) => v += messages.Length);
    return Results.Json(messages.Select((m) => new MessageOutput(m.Sender, m.Content.Content)));
}

IResult AddMessage(string lobbyId, string playerName, Message message) {
    lobbyMessages.Enqueue((playerName, message));
    return Results.Ok();
}

IResult GetLobbyStatus()
    => Results.Json(new LobbyStatus(lobbyStarted));

IResult StartLobby(string playerName, EntityWriter writer)
{
    if (lobby is null) return Results.BadRequest("Failed to start lobbby: it is not yet created.");
    if (!lobbyStarted)
    {
        var initialState = new InitialState(lobby.Players.Select(p => p.Name).ToArray());
        var startState = new GameStartState(0.5f, 0.5f);
        foreach (var player in lobby.Players)
            inputQueue.Add(player.Name, new() { initialState, startState });
        lobbyStarted = true;
        writer.GameStarted();
    }
    return Results.Redirect($"/game/{playerName}", true);
}

IResult DeletePlayer(int lobbyId, string playerName)
{
    if (lobby is null) return Results.BadRequest("Lobby is not created");
    if (lobby.Id != lobbyId) return Results.BadRequest($"Lobby is not found!");
    return lobby.Players.Remove(new(playerName)) ? Results.Ok() : Results.NotFound();
}

IResult DeleteBot(int lobbyId, string botName)
{
    if (lobby is null) return Results.BadRequest("Lobby is not created");
    if (lobby.Id != lobbyId) return Results.BadRequest($"Lobby is not found!");
    lobby.Bots.Remove(new(botName));
    return Results.Ok();
}

IResult GetGame(string playerName)
    => lobby!.Host.Name == playerName // check if lobby is null!
        ? Results.Content(File.ReadAllText(indexPagePath), "text/html")
        : Results.Content(File.ReadAllText(playerGamePagePath), "text/html");

IResult GetInputStates(string playerName)
{
    var currentQueue = inputQueue[playerName];
    var result = new List<State>(currentQueue.Count);
    while (currentQueue.TryTake(out var input))
        result.Add(input);
    return Results.Json(result);
}

void PushInputState(InputState state) => PushState(state);

void PushGameFinished(GameFinishedState gameFinished, EntityWriter writer)
{
    writer.GameFinished();
}

void PushState(State state)
{
    foreach (var queue in inputQueue.Values)
        queue.Add(state);
}

app.Run();

namespace Chacra {
    public record CreateLobby(string LobbyName, string PlayerName);
    public record RenameLobby(string NewName);
    public record JoinLobby(string LobbyName, string PlayerName);
    public record LobbyStatus(bool Started);
    public record PlayerJoinRequest(string PlayerName);
    public record PlayerJoinRequestInformation(string PlayerName, bool IsAccepted);
    public record BotJoinRequest(string BotName);
    public record AddPlayer(string PlayerName, string NewPlayer);
    public record AddBot(string PlayerName, string BotName);

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

    public record Message(string Content);
    public record MessageOutput(string Sender, string Content);

    public record LobbyInformation(int Id, string Name, int CurrentNumberOfPlayers, Game game);

    [JsonPolymorphic(TypeDiscriminatorPropertyName = "type")]
    [JsonDerivedType(typeof(InitialState), nameof(InitialState))]
    [JsonDerivedType(typeof(GameStartState), nameof(GameStartState))]
    [JsonDerivedType(typeof(GameFinishedState), nameof(GameFinishedState))]
    [JsonDerivedType(typeof(InputState), nameof(InputState))]
    [JsonDerivedType(typeof(DeltaState), nameof(DeltaState))]
    [JsonDerivedType(typeof(KnownBoosterState), nameof(KnownBoosterState))]
    public abstract record State();
    public record InitialState(string[] Players) : State();
    public record GameStartState(float X, float Y) : State();
    public record InputState(string Type, string PlayerName, float Dx, float Dy) : State();
    public record GameFinishedState() : State();
    public record DeltaState(long Delta) : State();
    public record KnownBoosterState(string Name, string Color, float Weight) : State();

    public record Player(string Name);
    public record Bot(string Name);
    public record Game(string Name, int NumberOfPlayers);
}
