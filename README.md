# School Management System

This project is now split into two clear parts:

- `client/`: React + Vite frontend.
- `server/`: ASP.NET Core 10 Web API backend.

The old MVC/Razor and EF-backed data layer have been removed. The remaining backend is a minimal ASP.NET Core API host for the React client.

## Run Locally

Start the full Aspire app host:

```bash
aspire run
```

The Aspire-hosted development URLs are:

```text
API: http://localhost:5243
Client: http://localhost:5174
```

Start the API:

```bash
dotnet run --launch-profile http
```

Start the React client:

```bash
cd client
npm install
npm run dev
```

Open the Vite URL shown in the terminal. During development, Vite proxies `/api` calls to `http://localhost:5243`.

## Build For .NET Hosting

Build the React app:

```bash
cd client
npm run build
```

The Vite build output is written to `wwwroot/client`. After that, the .NET app serves the React app for non-API routes and returns JSON 404s for missing `/api` endpoints.

## API

Swagger is available in development at:

```text
http://localhost:5243/swagger
```

Useful health endpoint:

```text
GET /api/system/status
```

The currently exposed backend health endpoint is `GET /api/system/status`.
