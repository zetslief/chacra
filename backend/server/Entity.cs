using System.Diagnostics; 
using Chacra;

public class Entity : BackgroundService
{
    private Stopwatch stopwatch = new();
    private readonly int delayMs = 1000 / 60;
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

    public void GameStarted()
    {
        started = true;
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
                stopwatch,
                delayMs,
                send,
                ref started,
                ref finished,
                ref sending);
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

    private static bool ProcessBoosterSpawner(
        Stopwatch stopwatch,
        int boosterSpawnDelay,
        Action<State> send)
    {
        static KnownBoosterState GenerateBooster()
            => new KnownBoosterState("BiggerPlayer", "purple", 40);

        var elapsed = stopwatch.ElapsedMilliseconds;
        if (elapsed < boosterSpawnDelay) return false;
        var booster = GenerateBooster();
        send(booster);
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

    public void GameStarted() => entity.GameStarted();
    public void GameFinished() => entity.GameFinished();
}
