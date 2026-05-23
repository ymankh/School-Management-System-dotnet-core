import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "katex/dist/katex.min.css"

import { AppProviders } from "@/app/providers"
import { ExamEnginePage } from "@/modules/exam-engine"
import "@/styles/globals.css"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppProviders>
      <ExamEnginePage />
    </AppProviders>
  </StrictMode>,
)
