using Microsoft.Extensions.FileProviders;

var builder = WebApplication.CreateBuilder(args);

var loginPagePath = Path.GetFullPath("../ui/dist/login.html");
var indexPagePath = Path.GetFullPath("../ui/dist/index.html");

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

app.MapPost("/connect", async (ctx) => {
    var form = await ctx.Request.ReadFormAsync();
    if (form.TryGetValue("playerName", out var playerName)) {
        Console.WriteLine($"Player name: {playerName}");
        ctx.Response.Redirect($"/connect/{playerName}");
    }
});

app.MapGet("/connect/{playerName}", (string playerName) => {
    return Results.Content(playerName);
});

app.MapGet("/game", () => {
    return Results.Content(File.ReadAllText(loginPagePath), "text/html");
});

app.Run();

public record Connect(string PlayerName);
public record Disconnect(string PlayerName);
public record InputState(string PlayerName, bool? clicked, float Dx, float Dy);