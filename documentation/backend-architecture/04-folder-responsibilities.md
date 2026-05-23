# Folder Responsibilities

## Api/

The `Api/` folder contains HTTP-facing code.

Use `Api/` for:

* Controllers
* API filters
* API middleware
* Request binding behavior
* Error responses

Controllers should be thin.

A controller should:

* Validate the HTTP shape
* Read route and query parameters
* Call application services or handlers
* Return HTTP responses

A controller should not contain:

* Business rules
* EF Core query details
* Password hashing logic
* File storage logic
* Email composition logic
* Complex workflow coordination

## Application/

The `Application/` folder contains use cases and orchestration.

Use `Application/` for:

* Commands
* Queries
* Use-case services
* Validation
* Mapping between DTOs and domain models
* Transaction orchestration

Application code can depend on domain code and infrastructure abstractions.

## Domain/

The `Domain/` folder contains business concepts.

Use `Domain/` for:

* Entities
* Value objects
* Domain services
* Domain rules
* Domain events
* Enums that describe business language

Domain code should not depend on ASP.NET Core, EF Core, controllers, HTTP, or database details.

## Infrastructure/

The `Infrastructure/` folder contains external technical details.

Use `Infrastructure/` for:

* EF Core implementations
* Email providers
* File storage
* Password hashing implementations
* Date/time providers
* External API clients

Infrastructure code can depend on application abstractions and domain models.

## Modules/

The `Modules/` folder contains business areas of the application.

Each module owns its own:

* Controllers
* DTOs
* Use cases
* Services
* Entities
* EF Core configuration
* Repositories, if used
* Validation
* Mapping

Example:

```txt
Modules/
  Students/
  Teachers/
  Classes/
  Exams/
  Attendance/
  Reports/
```

## Shared/

The `Shared/` folder contains reusable app-wide code.

Use `Shared/` for:

* Common result types
* Common API response shapes
* Common exceptions
* Shared validation helpers
* Cross-cutting interfaces
* Generic utilities

Do not put feature-specific business logic in `Shared/`.

## Data/

The `Data/` folder contains app-level database setup.

Use `Data/` for:

* `ApplicationDbContext`
* Migrations
* Database seeding
* Model registration

As the app grows, module-specific entity configuration should live near the owning module and be registered by `ApplicationDbContext`.

## Configuration/

The `Configuration/` folder contains startup and dependency registration.

Use `Configuration/` for:

* Service collection extensions
* Middleware registration extensions
* Options classes
* CORS setup
* Swagger setup
* Authentication and authorization setup
