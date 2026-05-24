import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "katex/dist/katex.min.css"

import { AppProviders } from "@/app/providers"
import { ExamEnginePage } from "@/modules/exam-engine"
import { ErrorBoundary } from "@/shared/components/error-boundary"
import "@/styles/globals.css"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppProviders>
      <ErrorBoundary>
        <ExamEnginePage />
      </ErrorBoundary>
    </AppProviders>
  </StrictMode>,
)
