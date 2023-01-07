using System.Net;
using System.Net.Http.Headers;
using Microsoft.Extensions.FileProviders;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddHostedService<GameLoopService>();
builder.Services.AddDbContext<Database>();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(configuration =>
{
     configuration.SwaggerDoc(
        "v1",
         new OpenApiInfo 
         { 
            Title = "Chacra API",
            Description = "API for Chacra",
            Version = "v1" 
        });
});

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

app.UseSwagger();
app.UseSwaggerUI(c =>
{
   c.SwaggerEndpoint("/swagger/v1/swagger.json", "Chacra API v1");
});

app.Services.GetService<Database>()!.Database.EnsureCreated();

app.MapGet("/", (Database db) => {
    return db.Enemies
        .Select(enemy => $"[{enemy.X}, {enemy.Y}]")
        .ToList();
});

app.MapPost("/setupState", (GameState state) => {
});

app.Run();

public record Collider(float X, float Y, float Radius);
public record Chakra(float X, float Y, Collider Collider);
public record GameState(Chakra[] Charas);