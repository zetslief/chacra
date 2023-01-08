using Microsoft.Extensions.FileProviders;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<Database>();
builder.Services.AddSingleton<GameStateService>();
builder.Services.AddHostedService<GameLoopService>();

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

app.MapGet("/", (GameStateService serivce) => {
    return serivce.GetState()
        .Enemies
        .ToArray();
});

app.MapGet("/initializeGameState", (GameStateService service) => {
    return service.GetState();
});

app.Run();