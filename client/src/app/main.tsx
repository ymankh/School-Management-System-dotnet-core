import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import { AppProviders } from "@/app/providers"
import { LandingPage } from "@/modules/landing"
import "@/styles/globals.css"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppProviders>
      <LandingPage />
    </AppProviders>
  </StrictMode>,
)
