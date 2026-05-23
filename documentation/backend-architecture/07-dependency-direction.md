# Dependency Direction

## Recommended Dependency Direction

```txt
Api
  -> Application
    -> Domain

Infrastructure
  -> Application
  -> Domain

Data
  -> Modules
  -> Domain

Shared
  -> no module-specific dependencies
```

Allowed:

```txt
Api -> Application
Application -> Domain
Application -> Shared
Infrastructure -> Application
Infrastructure -> Domain
Modules -> Shared
Data -> Modules
```

Avoid:

```txt
Domain -> Api
Domain -> Infrastructure
Domain -> EF Core
Shared -> Modules
ModuleA -> ModuleB -> ModuleA
Controllers -> DbContext directly for complex workflows
```

## Recommended Request Flow

```txt
HTTP Request
  -> Controller
    -> Use Case / Handler
      -> Domain Rules
      -> Repository / DbContext
        -> Database
    -> Response DTO
  -> HTTP Response
```

## Recommended Startup Flow

```txt
Program.cs
  -> AddApplication()
  -> AddInfrastructure()
  -> AddApi()
  -> UseApiPipeline()
```

`Program.cs` should stay small as the app grows.
