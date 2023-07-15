using Microsoft.Extensions.FileProviders;

var builder = WebApplication.CreateBuilder(args);

var indexPath = Path.GetFullPath("../ui/dist/index.html");

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
    return Results.Content(
        File.ReadAllText(indexPath),
        "text/html"
    );
});

app.Run();

public record Connect(string PlayerName);
public record Disconnect(string PlayerName);
public record InputState(string PlayerName, bool? clicked, float Dx, float Dy);