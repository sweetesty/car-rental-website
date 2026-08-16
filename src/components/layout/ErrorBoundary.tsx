import { Component, type ErrorInfo, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { Spinner } from '@/components/ui/Misc'

interface State {
  error: Error | null
  /** Set while the one silent retry is in flight. */
  retrying: boolean
  attempted: boolean
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
  state: State = { error: null, retrying: false, attempted: false }
  private timer: number | undefined

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Kept in the console rather than swallowed: this is the only record of
    // what actually broke, and it is what a bug report needs to be useful.
    console.error('Render error:', error, info.componentStack)

    /*
     * Try once, quietly, before saying anything.
     *
     * Most of what lands here is transient — a chunk that lost the race with a
     * deploy, a request that failed mid-render. Re-mounting fixes those, and
     * the person sees a spinner rather than an error page for a problem that
     * had already resolved itself. Exactly one retry: a genuine bug would
     * otherwise loop forever behind a spinner, which is worse than an honest
     * error.
     */
    if (!this.state.attempted) {
      this.setState({ retrying: true, attempted: true })
      this.timer = window.setTimeout(() => {
        this.setState({ error: null, retrying: false })
      }, 600)
    }
  }

  componentWillUnmount() {
    window.clearTimeout(this.timer)
  }

  /**
   * Re-mounts the subtree. `attempted` stays true, so if this fails the person
   * lands back on the error rather than being trapped behind a spinner that
   * silently retries forever.
   */
  private retry = () => {
    this.setState({ error: null, retrying: false })
  }

  render() {
    const { error, retrying } = this.state

    if (retrying) {
      return (
        <div className="grid min-h-[60svh] place-items-center">
          <Spinner className="size-8" />
        </div>
      )
    }

    if (!error) return this.props.children

    return (
      <div className="mx-auto grid min-h-[70svh] max-w-lg place-items-center px-4">
        <div className="text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400">
            <AlertTriangle className="size-7" />
          </span>

          <h1 className="mt-5 text-2xl font-black tracking-tight">This page didn't load</h1>
          <p className="text-dim mt-2 text-pretty">
            We already retried once and it still isn't loading. Try again, or reload the page if
            that doesn't help.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {/* Cheapest first: re-mounting costs nothing and fixes anything
                transient without throwing away the session or the scroll. */}
            <button
              type="button"
              onClick={this.retry}
              className="bg-brand-600 hover:bg-brand-700 rounded-lg px-5 py-2.5 text-sm font-bold text-white transition-colors"
            >
              Try again
            </button>
            {/* A full page load, not a router navigation: whatever broke may
                have left state that a soft reset won't clear. */}
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="surface-raised hover:border-brand-300 rounded-lg border px-5 py-2.5 text-sm font-bold transition-colors"
            >
              Reload the page
            </button>
          </div>

          <a href="/" className="text-dim hover:text-brand-600 mt-4 inline-block text-sm">
            Back to home
          </a>

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
