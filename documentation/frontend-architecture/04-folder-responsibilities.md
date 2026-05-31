# Folder Responsibilities

## app/

The `app/` folder contains application setup only.

```txt
app/
  main.tsx
  providers.tsx
  router.tsx
  query-client.ts
  env.ts
  app-config.ts
```

Use `app/` for:

* React root setup
* Global providers
* TanStack Router setup
* TanStack Query setup
* Environment config
* Global app configuration

Do not put business logic in `app/`.

Bad:

```txt
app/user-api.ts
app/order-form.tsx
app/report-table.tsx
```

Good:

```txt
modules/users/
modules/orders/
modules/reports/
```

## routes/

The `routes/` folder contains TanStack Router route files.

Routes should be thin.

A route should:

* Define the route
* Apply route-level guards
* Read route params
* Render a module page

A route should not contain:

* Business logic
* Large forms
* Large tables
* API logic
* Mutation logic
* Validation logic
* Complex UI behavior

Example:

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { UsersPage } from '@/modules/users'

export const Route = createFileRoute('/users')({
  component: UsersPage,
})
```

## modules/

The `modules/` folder contains the business domains of the application.

Each module owns its own:

* Pages
* Components
* API calls
* TanStack Query queries
* TanStack Query mutations
* Hooks
* Types
* Schemas
* Utilities
* Nested modules

Example:

```txt
modules/
  users/
  products/
  orders/
  reports/
  settings/
```

A module can contain sub-modules.

Example:

```txt
modules/
  sales/
    orders/
    invoices/
    payments/
```

A sub-module can repeat the same structure as a normal module.

## shared/

The `shared/` folder contains reusable app-wide code.

```txt
shared/
  api/
  components/
  hooks/
  lib/
  types/
  config/
  constants/
  permissions/
```

Use `shared/` for:

* Generic UI components
* shadcn/ui components
* Shared dashboard layout components
* Generic hooks
* Generic utilities
* API infrastructure
* Shared types
* Global constants
* Permission helpers
* Layout components

Dashboard pages for `admin`, `principal`, `teacher`, `student`, and `parent` should use
`shared/components/dashboard-shell.tsx` for the common page frame. The shell owns the
collapsible sidebar, role footer, logout affordance, page header, and page-list navigation.
Role modules should pass page definitions or route-aware navigation items into the shell
instead of rebuilding sidebar/header layout locally.

Do not put feature-specific business logic in `shared/`.

Bad:

```txt
shared/components/user-form.tsx
shared/types/order.types.ts
shared/hooks/use-product-actions.ts
```

Good:

```txt
modules/users/components/user-form.tsx
modules/orders/types/order.types.ts
modules/products/hooks/use-product-actions.ts
```

## assets/

The `assets/` folder contains static assets.

```txt
assets/
  images/
  icons/
  fonts/
```

## styles/

The `styles/` folder contains global styles.

```txt
styles/
  globals.css
```
