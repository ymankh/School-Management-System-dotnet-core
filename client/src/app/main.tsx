import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "katex/dist/katex.min.css"

import { App } from "@/app/app"
import { AppProviders } from "@/app/providers"
import { ErrorBoundary } from "@/shared/components/error-boundary"
import "@/styles/globals.css"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppProviders>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </AppProviders>
  </StrictMode>,
)
