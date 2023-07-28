public static class Bot
{
    public static async Task RunBotAsync(Uri connection, string playerName) 
    {
        await Task.Delay(5000);
        using var client = new HttpClient();

        while (true) {
            InputState state = new(playerName, false, 0, 1);
            await client.PostAsJsonAsync(connection, state).ConfigureAwait(false);
            await Task.Delay(50);
        }
    }
}