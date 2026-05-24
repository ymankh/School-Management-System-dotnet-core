import { Component, type ErrorInfo, type ReactNode } from "react"

type ErrorBoundaryProps = {
  children: ReactNode
  fallback?: ReactNode
}

type ErrorBoundaryState = {
  error: Error | null
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    error: null,
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("UI rendering failed", error, info)
  }

  render() {
    if (this.state.error) {
      return this.props.fallback ?? (
        <div className="m-4 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <div className="font-medium">This section could not be displayed.</div>
          <div className="mt-1 text-destructive/90">{this.state.error.message}</div>
          <button
            className="mt-3 rounded-md border border-destructive/30 bg-card px-3 py-1.5 text-sm font-medium text-destructive hover:bg-destructive/10"
            type="button"
            onClick={() => this.setState({ error: null })}
          >
            Try again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export { ErrorBoundary }
