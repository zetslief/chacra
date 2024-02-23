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
                await Task.Delay(delayMs, stoppingToken).ConfigureAwait(false);
                continue;
            }
            var elapsed = stopwatch.ElapsedMilliseconds;
            if (elapsed < delayMs)
            {
                await Task.Yield();
                continue;
            }
            stopwatch.Restart();
            send(new DeltaState(elapsed));
        }
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
