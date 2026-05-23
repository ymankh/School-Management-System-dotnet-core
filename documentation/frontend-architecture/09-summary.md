# Summary

Use:

```txt
src/
  app/       -> application setup
  routes/    -> TanStack Router route entry points
  modules/   -> business modules and nested modules
  shared/    -> reusable generic building blocks
```

Main rules:

```txt
Routes should be thin.
Modules should own business logic.
Modules can contain nested modules.
Shared should stay generic.
Cross-module pages should compose, not duplicate.
Permissions should be centralized.
TanStack Query logic should live inside the owning module.
shadcn/ui components should live in shared/components/ui.
```
