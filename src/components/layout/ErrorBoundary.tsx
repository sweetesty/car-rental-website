import { Component, type ErrorInfo, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'

interface State {
  error: Error | null
}

/**
 * Catches render errors so one broken component doesn't blank the whole site.
 *
 * Without a boundary anywhere in the tree, React's behaviour on an uncaught
 * render error is to unmount everything — the user gets a white page with no
 * explanation and no way forward except guessing that a reload might help.
 * That is what was happening.
 */
class Boundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Kept in the console rather than swallowed: this is the only record of
    // what actually broke, and it is what a bug report needs to be useful.
    console.error('Render error:', error, info.componentStack)
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div className="mx-auto grid min-h-[70svh] max-w-lg place-items-center px-4">
        <div className="text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400">
            <AlertTriangle className="size-7" />
          </span>

          <h1 className="mt-5 text-2xl font-black tracking-tight">This page didn't load</h1>
          <p className="text-dim mt-2 text-pretty">
            Something went wrong on our side. Reloading usually fixes it — if it keeps happening,
            let us know what you were doing.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {/* Deliberately a full page load, not a router navigation: whatever
                broke may have left the app in a state a soft reset won't clear. */}
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="bg-brand-600 hover:bg-brand-700 rounded-lg px-5 py-2.5 text-sm font-bold text-white transition-colors"
            >
              Reload the page
            </button>
            <a
              href="/"
              className="surface-raised rounded-lg border px-5 py-2.5 text-sm font-bold transition-colors hover:border-brand-300"
            >
              Back to home
            </a>
          </div>

          {import.meta.env.DEV && (
            <pre className="surface-sunken mt-6 max-h-48 overflow-auto rounded-lg border p-3 text-left text-xs">
              {error.stack ?? error.message}
            </pre>
          )}
        </div>
      </div>
    )
  }
}

/**
 * Re-keyed on the pathname so navigating away from a broken page clears the
 * error. A boundary that latches until a full reload turns one bad render into
 * a dead tab.
 */
export function ErrorBoundary({ children }: { children: ReactNode }) {
  const location = useLocation()
  return <Boundary key={location.pathname}>{children}</Boundary>
}
