import { useEffect, useMemo, useState } from 'react'
import './App.css'

type ApiStatus = {
  name: string
  status: string
  frontend: string
  backend: string
  endpoints: string[]
}

type LoadState =
  | { state: 'loading' }
  | { state: 'ready'; data: ApiStatus }
  | { state: 'error'; message: string }

const apiModules = [
  { label: 'Health Check', description: 'Confirms the ASP.NET API host is reachable.' },
  { label: 'Swagger', description: 'Documents the currently exposed backend routes in development.' },
]

const workflowItems = [
  'React client owns navigation, layout, and user interaction.',
  '.NET exposes JSON endpoints under /api only.',
  'Vite proxies API requests while developing locally.',
  'Production builds are served from wwwroot/client by the .NET app.',
]

function App() {
  const [loadState, setLoadState] = useState<LoadState>({ state: 'loading' })

  useEffect(() => {
    const controller = new AbortController()

    fetch('/api/system/status', { signal: controller.signal })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`API returned ${response.status}`)
        }

        return response.json() as Promise<ApiStatus>
      })
      .then((data) => setLoadState({ state: 'ready', data }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return
        }

        setLoadState({
          state: 'error',
          message: error instanceof Error ? error.message : 'Unable to reach the API.',
        })
      })

    return () => controller.abort()
  }, [])

  const statusLabel = useMemo(() => {
    if (loadState.state === 'ready') {
      return `${loadState.data.backend} is ${loadState.data.status}`
    }

    if (loadState.state === 'error') {
      return 'API connection failed'
    }

    return 'Checking API connection'
  }, [loadState])

  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="Primary navigation">
        <a className="brand" href="/">
          <span className="brand-mark" aria-hidden="true">S</span>
          <span>
            <strong>School System</strong>
            <small>React + .NET API</small>
          </span>
        </a>

        <nav className="nav-list">
          <a className="active" href="#overview">Overview</a>
          <a href="#modules">Modules</a>
          <a href="#api">API</a>
        </nav>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Refactored application shell</p>
            <h1>School management workspace</h1>
          </div>
          <div className={`status-pill ${loadState.state}`} role="status">
            <span aria-hidden="true" />
            {statusLabel}
          </div>
        </header>

        <section id="overview" className="overview-grid" aria-labelledby="overview-title">
          <div className="intro-panel">
            <p className="eyebrow">Architecture</p>
            <h2 id="overview-title">One React client, one .NET API backend.</h2>
            <p>
              The browser loads the React app, and the remaining backend currently exposes a
              minimal API surface under <code>/api</code>.
            </p>
          </div>

          <div className="workflow-panel" aria-label="Application responsibilities">
            {workflowItems.map((item, index) => (
              <div className="workflow-item" key={item}>
                <span>{index + 1}</span>
                <p>{item}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="modules" className="section-block" aria-labelledby="modules-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Backend surface</p>
              <h2 id="modules-title">Current API capabilities</h2>
            </div>
          </div>

          <div className="module-grid">
            {apiModules.map((module) => (
              <article className="module-card" key={module.label}>
                <h3>{module.label}</h3>
                <p>{module.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="api" className="section-block api-block" aria-labelledby="api-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Backend contract</p>
              <h2 id="api-title">Available API surface</h2>
            </div>
            <a className="docs-link" href="/swagger" target="_blank" rel="noreferrer">
              Open Swagger
            </a>
          </div>

          {loadState.state === 'loading' && (
            <div className="state-box" aria-live="polite">Loading API endpoints...</div>
          )}

          {loadState.state === 'error' && (
            <div className="state-box error" role="alert">
              {loadState.message}. Start the .NET backend on <code>http://localhost:5243</code>
              or update the Vite proxy target.
            </div>
          )}

          {loadState.state === 'ready' && (
            <div className="endpoint-list">
              {loadState.data.endpoints.map((endpoint) => (
                <code key={endpoint}>{endpoint}</code>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  )
}

export default App
