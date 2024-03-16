namespace Chacra.Api;

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


public record Player(string Name);
public record Bot(string Name);
public record Game(string Name, int NumberOfPlayers);
