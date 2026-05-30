var builder = DistributedApplication.CreateBuilder(args);

var postgres = builder.AddPostgres("postgres")
    .WithImageTag("18.4")
    .WithDataVolume("school-system-postgres-18-data")
    .AddDatabase("DefaultConnection", "school_system");

var api = builder.AddProject("api", "../server/SchoolSystemTask.csproj", launchProfileName: "http")
    .WithReference(postgres)
    .WaitFor(postgres);

builder.AddViteApp("client", "../client")
    .WithNpm()
    .WithHttpEndpoint(port: 5174, targetPort: 5174, isProxied: false)
    .WithReference(api)
    .WaitFor(api);

builder.Build().Run();
