namespace SchoolSystemTask;
public class Program
{
    public static void Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);

        builder.Services.AddCors(options =>
        {
            options.AddPolicy("ReactClient", policy =>
            {
                policy.WithOrigins(
                        "http://localhost:5173",
                        "https://localhost:5173",
                        "http://localhost:4173",
                        "https://localhost:4173")
                    .AllowAnyHeader()
                    .AllowAnyMethod()
                    .AllowCredentials();
            });
        });

        builder.Services.AddEndpointsApiExplorer();
        builder.Services.AddSwaggerGen();
        builder.Services.AddControllers();

        var app = builder.Build();

        // Configure the HTTP request pipeline.
        if (!app.Environment.IsDevelopment())
        {
            app.UseExceptionHandler("/api/errors");
            app.UseHsts();
        }
        else
        {
            app.UseSwagger();
            app.UseSwaggerUI();
        }

        if (!app.Environment.IsDevelopment())
        {
            app.UseHttpsRedirection();
        }
        app.UseStaticFiles();
        app.UseRouting();
        app.UseCors("ReactClient");

        app.MapControllers();
        app.MapFallback(async context =>
        {
            if (context.Request.Path.StartsWithSegments("/api"))
            {
                context.Response.StatusCode = StatusCodes.Status404NotFound;
                await context.Response.WriteAsJsonAsync(new { error = "API endpoint not found." });
                return;
            }

            var webRoot = app.Environment.WebRootPath ?? Path.Combine(app.Environment.ContentRootPath, "wwwroot");
            var indexPath = Path.Combine(webRoot, "client", "index.html");

            if (File.Exists(indexPath))
            {
                context.Response.ContentType = "text/html; charset=utf-8";
                await context.Response.SendFileAsync(indexPath);
                return;
            }

            context.Response.ContentType = "text/plain; charset=utf-8";
            await context.Response.WriteAsync(
                "React client is not built yet. Run `npm run dev` from the client folder during development, or `npm run build` to serve it from .NET.");
        });

        app.Run();
    }
}
