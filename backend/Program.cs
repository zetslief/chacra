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

app.UseSwagger();
app.UseSwaggerUI(c =>
{
   c.SwaggerEndpoint("/swagger/v1/swagger.json", "Chacra API v1");
});

app.MapGet("/", () => "Main Page");
app.MapGet("/{id}", (int id) => $"Hello, World {id}");

app.Run();
