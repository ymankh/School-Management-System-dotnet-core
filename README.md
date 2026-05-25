# School System Task

A school management web app with a React frontend and an ASP.NET Core API backend. The current focus is the exam portal: teachers can create and manage exams, students can take exams, and admins have a placeholder portal for future modules.

## Project Structure

- `client/` - React 19, Vite 8, TypeScript, Tailwind CSS, shadcn UI, React Query.
- `server/` - ASP.NET Core 10 Web API, EF Core, Swagger, OpenTelemetry, static hosting for the built client.
- `SchoolSystemTask.AppHost/` - .NET Aspire app host for running Postgres, the API, and the Vite client together.
- `tests/SchoolSystemTask.Tests/` - xUnit tests for backend helpers and exam-store behavior.
- `documentation/` - frontend/backend architecture notes and exam-engine implementation notes.

## Current Features

- Landing page, registration, login, and local session handling.
- Role-based portal routing for `admin`, `teacher`, and `student`.
- Collapsible shadcn sidebar navigation.
- Teacher exam dashboard with filtering, exam publishing, archiving, duplication, grading, mark publishing, attachments, and question-bank import.
- Student exam list, attempt start/resume, autosaved answers, file upload questions, submission, and results.
- EF Core migrations with SQLite for local development and PostgreSQL for Aspire/default production-style configuration.

## Prerequisites

- .NET 10 SDK.
- Node.js LTS and npm.
- .NET Aspire workload if you want to run the full app host.
- PostgreSQL only when running outside the development SQLite profile or Aspire-managed Postgres.

## Run Locally

### Full Aspire App

From the repository root:

```bash
aspire run
```

Aspire starts:

```text
API: http://localhost:5243
Client: http://localhost:5174
Postgres: managed by Aspire
```

### API Only

From the repository root:

```bash
dotnet run --project server/SchoolSystemTask.csproj --launch-profile http
```

In development, the API uses `server/appsettings.Development.json`:

```text
Data Source=school-system-dev.db
```

EF Core migrations run automatically at startup.

### Client Only

```bash
cd client
npm install
npm run dev
```

The Vite dev server runs on:

```text
http://localhost:5174
```

During development, Vite proxies `/api` to:

```text
http://localhost:5243
```

## Build

Build the React client:

```bash
cd client
npm run build
```

The built client is emitted to `server/wwwroot/client` and can be served by the ASP.NET Core app for non-API routes.

Build the backend:

```bash
dotnet build SchoolSystemTask.slnx
```

## Test

Run backend tests:

```bash
dotnet test SchoolSystemTask.slnx
```

Run frontend tests:

```bash
cd client
npm run test
```

Run frontend lint:

```bash
cd client
npm run lint
```

## API

Swagger is available in development:

```text
http://localhost:5243/swagger
```

Health check:

```text
GET /health
```

Main API groups:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/session/{id}`
- `GET /api/exams`
- `POST /api/exams`
- `GET /api/exams/{id}`
- `PUT /api/exams/{id}`
- `POST /api/exams/{id}/publish`
- `POST /api/exams/{id}/archive`
- `POST /api/exams/{id}/duplicate`
- `POST /api/exams/{id}/attempts`
- `GET /api/students/{studentId}/exams`
- `GET /api/students/{studentId}/exams/{id}/attempt`
- `PUT /api/attempts/{attemptId}/answers/{questionId}`
- `POST /api/attempts/{attemptId}/submit`
- `GET /api/question-bank`

## Notes

- The backend chooses SQLite when the connection string starts with `Data Source=` or `Filename=`.
- Otherwise, the backend uses PostgreSQL through Npgsql.
- Uploaded exam attachments and attempt files are stored under `server/wwwroot/uploads`.
- Missing `/api` routes return JSON 404 responses; other unknown routes fall back to the built React app when available.
