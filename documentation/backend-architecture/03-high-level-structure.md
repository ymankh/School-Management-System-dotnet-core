# High-Level Structure

Recommended backend structure:

```txt
server/
  Api/
  Application/
  Domain/
  Infrastructure/
  Modules/
  Shared/
  Data/
  Configuration/
```

For smaller features, prefer starting inside `Modules/` and extracting shared infrastructure only when it is genuinely reused.
