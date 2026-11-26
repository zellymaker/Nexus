import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { useStore } from '../lib/store'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

/**
 * Last-resort UI boundary: never leave the user with a white window.
 * Exposes a copyable error message and a safe reload.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    useStore.getState().recordDiagnostic(`UI error: ${error.message}`)
    void info
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-app p-8 text-center">
        <p className="text-[16px] font-semibold text-ink">Something went wrong</p>
        <p className="max-w-[460px] text-[13px] leading-[1.55] text-ink-mute">
          {this.state.error.message}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => this.setState({ error: null })}
            className="rounded-lg border border-line px-3 py-1.5 text-[13px] text-ink-soft hover:bg-hover"
          >
            Try again
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-lg bg-accent px-3 py-1.5 text-[13px] text-white hover:bg-accent-bright"
          >
            Reload NEXUS
          </button>
        </div>
      </div>
    )
  }
}
