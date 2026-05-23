# Module Structure

Each module or sub-module can use this structure:

```txt
module-name/
  api/
    module-api.ts
    module-queries.ts
    module-mutations.ts

  components/
    module-table.tsx
    module-form.tsx
    module-card.tsx
    module-actions.tsx
    module-status-badge.tsx

  hooks/
    use-module-form.ts
    use-module-actions.ts
    use-module-filters.ts

  schemas/
    module-schema.ts

  types/
    module.types.ts

  utils/
    module-mappers.ts
    module-formatters.ts

  pages/
    module-list-page.tsx
    module-details-page.tsx
    module-create-page.tsx
    module-edit-page.tsx

  modules/
    nested-module/

  index.ts
```

## Nested Modules

Modules can contain other modules when the business area becomes large.

Example:

```txt
modules/
  domain-a/
    module-a/
      api/
      components/
      hooks/
      schemas/
      types/
      pages/
      modules/
        nested-module-a/
        nested-module-b/
      index.ts

    module-b/
      api/
      components/
      hooks/
      schemas/
      types/
      pages/
      index.ts

    index.ts
```

Use nested modules when:

* A module becomes too large
* A sub-area has its own pages
* A sub-area has its own API calls
* A sub-area has its own business rules
* A sub-area can be understood as a separate capability

Do not nest modules just to make folders look organized.

## Example Generic Structure

```txt
src/
  app/
    main.tsx
    providers.tsx
    router.tsx
    query-client.ts
    env.ts
    app-config.ts

  routes/
    __root.tsx
    index.tsx

    _public.tsx
    _public/
      login.tsx

    _authenticated.tsx
    _authenticated/
      dashboard.tsx
      module-a.tsx
      module-a.$id.tsx
      module-b.tsx
      module-c.tsx
      settings.tsx

  modules/
    auth/
      api/
      components/
      hooks/
      schemas/
      types/
      pages/
      index.ts

    identity/
      users/
      roles/
      permissions/
      profile/
      index.ts

    module-a/
      api/
        module-a-api.ts
        module-a-queries.ts
        module-a-mutations.ts

      components/
        module-a-table.tsx
        module-a-form.tsx
        module-a-card.tsx
        module-a-actions.tsx

      hooks/
        use-module-a-form.ts
        use-module-a-actions.ts

      schemas/
        module-a-schema.ts

      types/
        module-a.types.ts

      utils/
        module-a-mappers.ts
        module-a-formatters.ts

      pages/
        module-a-list-page.tsx
        module-a-details-page.tsx
        module-a-create-page.tsx
        module-a-edit-page.tsx

      modules/
        nested-module-a/
          api/
          components/
          hooks/
          schemas/
          types/
          pages/
          index.ts

        nested-module-b/
          api/
          components/
          hooks/
          schemas/
          types/
          pages/
          index.ts

      index.ts

    module-b/
      api/
      components/
      hooks/
      schemas/
      types/
      utils/
      pages/
      modules/
      index.ts

    module-c/
      api/
      components/
      hooks/
      schemas/
      types/
      utils/
      pages/
      index.ts

    reports/
      api/
      components/
      hooks/
      types/
      pages/
      index.ts

    settings/
      api/
      components/
      hooks/
      schemas/
      types/
      pages/
      index.ts

    workflows/
      workflow-a/
      workflow-b/
      workflow-c/
      index.ts

  shared/
    api/
      http-client.ts
      api-error.ts
      api-response.ts

    components/
      ui/
        button.tsx
        dialog.tsx
        dropdown-menu.tsx
        input.tsx
        table.tsx
        form.tsx

      layout/
        app-layout.tsx
        app-sidebar.tsx
        app-header.tsx
        page-header.tsx

      feedback/
        loading-state.tsx
        empty-state.tsx
        error-state.tsx

      data-display/
        data-table.tsx
        pagination.tsx
        status-badge.tsx

      form/
        date-picker-field.tsx
        select-field.tsx
        text-field.tsx

    hooks/
      use-debounce.ts
      use-media-query.ts
      use-local-storage.ts

    lib/
      cn.ts
      utils.ts
      dates.ts
      formatters.ts

    types/
      common.types.ts
      api.types.ts
      pagination.types.ts

    config/
      navigation.ts
      role-navigation.ts

    permissions/
      can.ts
      permissions.ts
      role-permissions.ts

    constants/
      routes.ts
      query.ts

  assets/
    images/
    icons/

  styles/
    globals.css
```
