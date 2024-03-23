using System.Diagnostics;
using Chacra.Colors;
using Chacra.State;

public class Entity : BackgroundService
{
    private readonly Stopwatch stopwatch = new();
    private readonly Stopwatch boosterStopwatch = new();
    private readonly int delayMs = 1000 / 60;
    private readonly TimeSpan boosterDelayMs = TimeSpan.FromSeconds(3);
    private readonly Action<State> send;
    private bool started = false;
    private bool finished = false;
    private bool sending = false;

    public Entity(Action<State> sendState)
    {
        this.send = sendState;
        this.Writer = new(this);
    }

    public EntityWriter Writer { get; }

    public void GameStarted(string[] players)
    {
        started = true;
        var selectedColors = new HashSet<string>();
        var numberOfColors = Colors.NumberOfColors;
        var playerData = new PlayerData[players.Length];
        for (var playerIndex = 0; playerIndex < playerData.Length; ++playerIndex)
        {
            var playerColor = Colors.GetRandomColor();
            while (selectedColors.Contains(playerColor) && selectedColors.Count < Colors.NumberOfColors)
            {
                playerColor = Colors.GetRandomColor();
            }
            if (!selectedColors.Contains(playerColor))
                selectedColors.Add(playerColor);
            selectedColors.Add(playerColor);
            playerData[playerIndex] = new(players[playerIndex], playerColor);
        }
        var gameData = new GameData(1200, 800); 
        var initialState = new InitialState(gameData, playerData);
        var startState = new GameStartState(0.5f, 0.5f);
        this.send(initialState);
        this.send(startState);
    }

    public void GameFinished()
    {
        finished = true;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            bool sent = ProcessDeltaTime(
                stopwatch, delayMs, send, ref started, ref finished, ref sending);
            if (sending)
            {
                ProcessBoosterSpawner(boosterStopwatch, boosterDelayMs, send);
            }
            else
            {
                boosterStopwatch.Stop();
            }

            if (sending && !sent)
            {
                await Task.Yield();
            }
            else
            {
                await Task.Delay(delayMs).ConfigureAwait(false);
            }
        }
    }

    private static bool ProcessDeltaTime(
        Stopwatch stopwatch,
        int delay,
        Action<DeltaState> send,
        ref bool started, 
        ref bool finished,
        ref bool sending)
    {
        if (started)
        {
            started = false;
            sending = true;
            stopwatch.Start();
            Console.WriteLine("Staring the game...");
        }
        if (finished)
        {
            stopwatch.Stop();
            sending = false;
            finished = false;
            Console.WriteLine("Finishing the game...");
        }
        if (!sending)
        {
            stopwatch.Stop();
            return false;
        }
        var elapsed = stopwatch.ElapsedMilliseconds;
        if (elapsed < delay) return false;
        stopwatch.Restart();
        send(new DeltaState(elapsed));
        return true;
    }

    private static readonly KnownBoosterState[] knownBoosters = {
        new("biggerPlayer", "purple", 40),
        new("biggerBall", "lightgreen", 30),
        // new("shuffleBoosters", "yellow", 5),
        new("deathBall", "darkred", 1),
        // new("obstacle", "gold", 20),
        new("megaElectric", "cyan", 10),
    };

    private static readonly Random boosterRandom = new();
    private static bool ProcessBoosterSpawner(
        Stopwatch stopwatch,
        TimeSpan boosterSpawnDelay,
        Action<KnownBoosterState> send)
    {
        static KnownBoosterState GenerateBooster()
            => knownBoosters[boosterRandom.Next(knownBoosters.Length)];

        if (!stopwatch.IsRunning) stopwatch.Start();
        var elapsed = stopwatch.Elapsed;
        if (elapsed < boosterSpawnDelay) return false;
        var booster = GenerateBooster();
        Console.WriteLine($"Generating the booster: {booster}");
        send(booster);
        stopwatch.Restart();
        return true;
    }

}

public class EntityWriter
{
    private readonly Entity entity;

    public EntityWriter(Entity entity)
    {
        this.entity = entity;
    }

    public void GameStarted(string[] players) => entity.GameStarted(players);
    public void GameFinished() => entity.GameFinished();
}
