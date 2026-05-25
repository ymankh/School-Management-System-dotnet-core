# Summary

Use:

```txt
server/
  Api/              -> HTTP entry points and API pipeline
  Application/      -> use cases, orchestration, validation
  Domain/           -> entities, value objects, business rules
  Infrastructure/   -> EF Core, email, files, hashing, external systems
  Modules/          -> business modules and nested modules
  Shared/           -> reusable generic building blocks
  Data/             -> ApplicationDbContext, migrations, database setup
  Configuration/    -> dependency registration and startup extensions
```

Main rules:

```txt
Controllers should be thin.
Modules should own business logic.
DTOs should live near the owning module.
Domain code should not depend on infrastructure.
Shared should stay generic.
Cross-module workflows should compose, not duplicate.
Authorization should use policies or capabilities.
Program.cs should stay small as the app grows.
EF Core migrations should be generated with the CLI, not created by hand.
```
