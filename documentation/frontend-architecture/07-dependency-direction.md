# Dependency Direction

## Recommended Dependency Direction

```txt
app
  -> routes
    -> modules
      -> shared
```

Allowed:

```txt
routes -> modules
modules -> shared
app -> shared
modules/workflows -> modules
```

Avoid:

```txt
shared -> modules
modules -> routes
module-a -> module-b -> module-a
```

## Recommended Page Composition Pattern

```txt
Route
  -> Module Page
    -> Module Components
      -> Module Hooks
        -> Module Queries / Mutations
          -> Module API
            -> Shared HTTP Client
```
