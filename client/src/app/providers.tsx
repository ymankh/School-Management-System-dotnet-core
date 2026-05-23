import type { ReactNode } from "react"

type AppProvidersProps = {
  children: ReactNode
}

function AppProviders({ children }: AppProvidersProps) {
  return children
}

export { AppProviders }
