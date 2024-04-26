using System.Diagnostics;
using Chacra;
using Chacra.Colors;
using Chacra.State;

public class Entity : BackgroundService
{
    private readonly Stopwatch stopwatch = new();
    private readonly Stopwatch boosterStopwatch = new();
    private readonly int delayMs = 1000 / 60;
    private readonly TimeSpan boosterDelayMs = TimeSpan.FromSeconds(3);
    private readonly Action<State> send;
    private readonly ILogger<Entity> logger;
    private bool started = false;
    private bool finished = false;
    private bool sending = false;

    public Entity(ILogger<Entity> logger, Action<State> sendState)
    {
        this.send = sendState;
        this.Writer = new(this);
        this.logger = logger;
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
                stopwatch, delayMs, send, logger, ref started, ref finished, ref sending);
            if (sending)
            {
                ProcessBoosterSpawner(boosterStopwatch, boosterDelayMs, send, logger);
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
        ILogger logger,
        ref bool started, 
        ref bool finished,
        ref bool sending)
    {
        if (started)
        {
            started = false;
            sending = true;
            stopwatch.Start();
            logger.Log(LogLevel.Information, "Staring the game...");
        }
        if (finished)
        {
            stopwatch.Stop();
            sending = false;
            finished = false;
            logger.Log(LogLevel.Information, "Finishing the game...");
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

    private static readonly Random boosterRandom = new();
    private static bool ProcessBoosterSpawner(
        Stopwatch stopwatch,
        TimeSpan boosterSpawnDelay,
        Action<BoosterState> send,
        ILogger logger)
    {
        static BoosterState GenerateBooster()
        {
            var boosterIndex = boosterRandom.Next(BoosterFactory.All.Length);
            var booster = BoosterFactory.All[boosterIndex];
            return BoosterFactory.Create(boosterRandom.Next(8), booster);
        }

        if (!stopwatch.IsRunning) stopwatch.Start();
        var elapsed = stopwatch.Elapsed;
        if (elapsed < boosterSpawnDelay) return false;
        var booster = GenerateBooster();
        logger.Log(LogLevel.Information, "Generating the booster: {booster}", booster);
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
