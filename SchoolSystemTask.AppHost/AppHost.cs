var builder = DistributedApplication.CreateBuilder(args);

var postgres = builder.AddPostgres("postgres")
    .WithDataVolume()
    .AddDatabase("DefaultConnection", "school_system");

var api = builder.AddProject("api", "../server/SchoolSystemTask.csproj", launchProfileName: "http")
    .WithReference(postgres)
    .WaitFor(postgres);

builder.AddExecutable(
        "client",
        "npm",
        "../client",
        "run",
        "dev",
        "--",
        "--host",
        "localhost",
        "--port",
        "5174",
        "--strictPort")
    .WithHttpEndpoint(port: 5174, targetPort: 5174, isProxied: false)
    .WithReference(api)
    .WaitFor(api);

builder.Build().Run();
