# Design Boundary Rules

## 1. A module owns its business language

Each module should own the terms, types, schemas, and rules related to its own business area.

Bad:

```txt
modules/module-a/types/module-b.types.ts
modules/module-b/types/module-b.types.ts
```

Good:

```txt
modules/module-b/types/module-b.types.ts
```

Do not define the same business type in multiple modules.

## 2. A module owns its API calls

API calls for a business area should live inside that business module.

Bad:

```txt
shared/api/user-api.ts
shared/api/order-api.ts
```

Good:

```txt
modules/users/api/user-api.ts
modules/orders/api/order-api.ts
```

The `shared/api/` folder should only contain generic API infrastructure.

Good:

```txt
shared/api/http-client.ts
shared/api/api-error.ts
shared/api/api-response.ts
```

## 3. Routes should not own business logic

Routes should be entry points only.

Bad:

```tsx
// routes/_authenticated/module-a.tsx

const { data } = useQuery(...)
const mutation = useMutation(...)
const form = useForm(...)
```

Good:

```tsx
// routes/_authenticated/module-a.tsx

import { ModuleAPage } from '@/modules/module-a'

export const Route = createFileRoute('/_authenticated/module-a')({
  component: ModuleAPage,
})
```

## 4. Shared should not become a dumping ground

Only move code to `shared/` when it is truly generic and used by multiple modules.

Bad:

```txt
shared/components/module-a-form.tsx
shared/hooks/use-module-a-actions.ts
shared/types/module-a.types.ts
```

Good:

```txt
modules/module-a/components/module-a-form.tsx
modules/module-a/hooks/use-module-a-actions.ts
modules/module-a/types/module-a.types.ts
```

## 5. Avoid direct imports between unrelated modules

A module should not freely import internal files from another module.

Bad:

```ts
import { SomeInternalComponent } from '@/modules/module-a/components/some-internal-component'
```

Better:

```ts
import { PublicComponent } from '@/modules/module-a'
```

Best:

* Pass data through props
* Compose modules at the page level
* Move truly reusable code to `shared/`
* Create a workflow module when coordination is needed

## 6. Use composition for cross-module pages

Some pages naturally need data and UI from multiple modules.

This is allowed at the page or workflow level.

Example:

```txt
modules/module-a/pages/module-a-details-page.tsx
```

can compose:

```txt
ModuleASummary
ModuleBRelatedList
ModuleCStatusCard
```

But each module should still own its own logic.

## 7. Avoid circular dependencies

A module should not depend on another module that also depends on it.

Bad:

```txt
module-a imports module-b
module-b imports module-a
```

Better:

```txt
page or workflow composes module-a and module-b
module-a does not own module-b
module-b does not own module-a
```

## 8. Keep reusable UI separate from business UI

shadcn/ui components should live here:

```txt
shared/components/ui/
```

Generic app components should live here:

```txt
shared/components/layout/
shared/components/feedback/
shared/components/data-display/
shared/components/form/
```

Business components should live inside modules.

Good:

```txt
modules/module-a/components/module-a-form.tsx
modules/module-b/components/module-b-table.tsx
```

## 9. Separate server state from client state

Use TanStack Query for server state:

* API data
* Lists
* Details
* Search results
* Mutations
* Cache invalidation

Use local state for UI state:

* Dialog open state
* Selected tab
* Expanded rows
* Sidebar state
* Form step
* Temporary filters
* Dropdown state

Do not duplicate server state in global stores.

## 10. Query keys belong to the owning module

Bad:

```txt
shared/query-keys.ts
```

Good:

```txt
modules/module-a/api/module-a-queries.ts
modules/module-b/api/module-b-queries.ts
```

Each module should own its own query keys.

## 11. Mutations belong to the owning module

Bad:

```txt
shared/mutations.ts
```

Good:

```txt
modules/module-a/api/module-a-mutations.ts
```

Mutation invalidation rules should be close to the mutation itself.

## 12. Keep permissions centralized

Permission logic should not be scattered across components.

Bad:

```tsx
if (user.role === 'admin') {
  return <Button />
}
```

Better:

```tsx
if (can(user, 'module-a:create')) {
  return <Button />
}
```

Use:

```txt
shared/permissions/
  can.ts
  permissions.ts
  role-permissions.ts
```

Or:

```txt
modules/identity/permissions/
```

## 13. Prefer capability-based permissions over role checks

Bad:

```tsx
user.role === 'admin'
user.role === 'manager'
user.role === 'viewer'
```

Good:

```tsx
can(user, 'resource:create')
can(user, 'resource:update')
can(user, 'resource:delete')
can(user, 'resource:view')
```

Roles can change. Capabilities are more stable.

## 14. Keep forms inside the owning module

Business forms belong inside modules.

Bad:

```txt
shared/forms/module-a-form.tsx
```

Good:

```txt
modules/module-a/components/module-a-form.tsx
```

Generic form fields can live in shared:

```txt
shared/components/form/
  date-picker-field.tsx
  select-field.tsx
  text-field.tsx
```

## 15. Keep table columns near the table

For complex tables, keep columns inside the module.

Good:

```txt
modules/module-a/components/module-a-table.tsx
modules/module-a/components/module-a-table-columns.tsx
```

Do not put all table columns in one global shared folder.

## 16. Keep validation schemas near the module

Good:

```txt
modules/module-a/schemas/module-a-schema.ts
```

Shared validation helpers can go here:

```txt
shared/lib/validations.ts
```

## 17. Create workflow modules for cross-module processes

Some workflows coordinate multiple modules.

Examples:

```txt
modules/workflows/
  workflow-a/
  workflow-b/
  workflow-c/
```

A workflow module can:

* Read from multiple modules
* Compose multiple module components
* Coordinate a multi-step process
* Handle cross-module UI flow

A workflow module should not steal ownership of business logic from the original modules.

## 18. Do not duplicate modules by role or page type

Bad:

```txt
admin-users/
manager-users/
viewer-users/
```

Good:

```txt
users/
```

Then use role-specific pages when needed:

```txt
users/pages/admin-users-page.tsx
users/pages/manager-users-page.tsx
users/pages/viewer-users-page.tsx
```

Shared business logic remains in the module.

## 19. Keep module public APIs small

Each module should expose only what other parts of the app are allowed to use.

Use `index.ts`.

Good:

```ts
export { ModuleAPage } from './pages/module-a-page'
export type { ModuleA } from './types/module-a.types'
```

Do not export every internal file.

## 20. Avoid deep imports from other modules

Avoid:

```ts
import { ModuleAForm } from '@/modules/module-a/components/module-a-form'
```

Prefer:

```ts
import { ModuleAForm } from '@/modules/module-a'
```

Only export something if it is safe to be used outside the module.

## 21. Use naming that matches the business domain

Prefer business names over generic names.

Bad:

```txt
items/
records/
things/
data/
management/
```

Good:

```txt
users/
orders/
products/
payments/
notifications/
reports/
settings/
```

## 22. Keep layout generic

Layouts should not contain business logic.

Good:

```txt
shared/components/layout/app-layout.tsx
shared/components/layout/sidebar.tsx
shared/components/layout/header.tsx
```

Bad:

```txt
shared/components/layout/user-payment-sidebar.tsx
```

Business-specific navigation config can live in:

```txt
shared/config/navigation.ts
shared/config/role-navigation.ts
```

Or in the owning module if it is module-specific.

## 23. Keep feature flags and configuration centralized

Use a central place for app-wide config.

```txt
shared/config/
  feature-flags.ts
  navigation.ts
  app-settings.ts
```

Module-specific config should stay inside the module.

```txt
modules/module-a/config/module-a-config.ts
```

## 24. Prefer explicit module boundaries

A module should have a clear reason to exist.

Each module should answer:

* What business capability does this module own?
* What data does this module own?
* What pages does this module provide?
* What API calls does this module own?
* What can other modules import from it?

If these answers are unclear, the module boundary is probably wrong.

## 25. Split modules when they become too large

Split a module when:

* It has many unrelated pages
* It has multiple independent workflows
* It has too many components
* It has several different business concepts
* Multiple developers often edit unrelated parts of it

Example:

```txt
modules/module-a/
  sub-module-a/
  sub-module-b/
  sub-module-c/
```

## 26. Merge modules when they are too small

Avoid creating tiny modules that only contain one small component and no business responsibility.

Bad:

```txt
modules/status-badge/
modules/date-label/
modules/delete-button/
```

Good:

```txt
shared/components/
```

or place the component inside the owning module.

## 27. Keep pages above components

Pages compose components.

Components should not import pages.

Allowed:

```txt
pages -> components
components -> hooks
hooks -> api
api -> shared/api
```

Avoid:

```txt
components -> pages
api -> components
shared -> modules
```

## 28. Use one module as the source of truth

If a concept belongs to one module, that module should be the source of truth.

Other modules may display that concept, but should not redefine it.

Bad:

```txt
module-a/types/status.types.ts
module-b/types/status.types.ts
module-c/types/status.types.ts
```

Good:

```txt
module-a/types/status.types.ts
```

Then export it from:

```txt
modules/module-a/index.ts
```
