import axios, { AxiosError } from 'axios'
import { currentIdToken } from './firebase'

/**
 * HTTP client for the AUTOGO API.
 *
 * In dev, Vite proxies `/api` to the Express server on :5000 (see vite.config.ts),
 * so the default base URL is relative. Set `VITE_API_URL` to point at a deployed
 * backend instead.
 */
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  /*
   * Long enough to survive a cold start.
   *
   * Render's free tier sleeps after ~15 minutes idle and takes 30–50s to wake.
   * At the old 15s the FIRST request after any quiet spell always timed out,
   * so a visitor arriving at a sleeping API saw an empty fleet — reported as
   * "0 cars match your search", which blames their filters for an
   * infrastructure problem. Skeletons cover the wait; DataContext retries.
   */
  timeout: 60_000,
  headers: { 'Content-Type': 'application/json' },
})

/**
 * Auth is a Firebase ID token, minted per request. Tokens expire hourly, so we
 * ask the SDK each time rather than caching one — it serves from memory until
 * it needs to refresh.
 */
api.interceptors.request.use(async (config) => {
  const token = await currentIdToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

/** Fires when the API rejects our token, so the app can drop the session. */
type UnauthorizedHandler = () => void
let onUnauthorized: UnauthorizedHandler = () => {}
export const setUnauthorizedHandler = (fn: UnauthorizedHandler) => {
  onUnauthorized = fn
}

/**
 * Creates the local user record for a valid Firebase session that has none.
 *
 * Registered by AuthContext rather than imported, because services.ts imports
 * this module — calling it directly would be a circular import.
 */
type ResyncHandler = (() => Promise<unknown>) | null
let onNeedsResync: ResyncHandler = null
export const setResyncHandler = (fn: ResyncHandler) => {
  onNeedsResync = fn
}

let retriedOnce = false
let resyncing = false

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ message?: string }>) => {
    const status = error.response?.status
    const config = error.config

    // A 401 may just be a token that expired mid-flight. Force a refresh and
    // replay the request once before treating the session as dead.
    if (status === 401 && config && !retriedOnce) {
      retriedOnce = true
      const fresh = await currentIdToken(true)
      if (fresh) {
        config.headers = config.headers ?? {}
        config.headers.Authorization = `Bearer ${fresh}`
        try {
          const replayed = await api.request(config)
          retriedOnce = false
          return replayed
        } catch {
          // fall through to the handler below
        }
      }
      retriedOnce = false
      onUnauthorized()
    }

    /*
     * 409 means the Firebase session is valid but no local account exists yet
     * — usually because the first sync failed while the API was unreachable.
     * Create the record and replay, rather than showing the user an error they
     * cannot possibly act on.
     */
    if (status === 409 && config && onNeedsResync && !resyncing) {
      resyncing = true
      try {
        await onNeedsResync()
        return await api.request(config)
      } catch {
        // Fall through and surface the original failure.
      } finally {
        resyncing = false
      }
    }

    return Promise.reject(error)
  },
)

const STATUS_MESSAGES: Record<number, string> = {
  400: 'That request was rejected — check the details and try again.',
  401: 'Your session has expired. Please sign in again.',
  403: 'The AUTOGO API refused that request. If the server is running, check that you are signed in with the right account.',
  404: "That endpoint doesn't exist on the API — the server may be running an older version.",
  // Recovered automatically by the interceptor above; if the user still sees
  // this, the resync itself failed and signing in again is the way out.
  409: 'We could not finish setting up your account. Please sign out and sign in again.',
  429: 'Too many requests. Give it a moment and try again.',
  503: 'That service is not configured on the server yet.',
}

/** Statuses whose server text names internals and must never be shown as-is. */
const DEVELOPER_FACING = new Set([409])

/**
 * Turns an axios failure into something a person can act on. Prefers the
 * message the Express error handler sent; otherwise maps the status code.
 * Never surfaces raw "Request failed with status code 403".
 */
export function apiError(error: unknown, fallback = 'Something went wrong.') {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status

    /*
     * A few server messages are written for whoever is reading the logs, not
     * for a customer — "Call /api/auth/sync first" is an instruction nobody
     * outside this codebase can act on. Prefer our own wording for those.
     */
    if (status && DEVELOPER_FACING.has(status)) return STATUS_MESSAGES[status]

    const message = (error.response?.data as { message?: string } | undefined)?.message
    if (message) return message

    if (error.code === 'ECONNABORTED') return 'The server took too long to respond.'
    if (status === undefined) return 'Cannot reach the AUTOGO API. Is the server running?'

    if (STATUS_MESSAGES[status]) return STATUS_MESSAGES[status]
    if (status >= 500) return 'The AUTOGO API hit an error. Check the server logs.'
    return `The API rejected that request (${status}).`
  }
  if (error instanceof Error) return error.message
  return fallback
}

/** True when the failure is "server unreachable" rather than a rejected request. */
export function isOffline(error: unknown) {
  return axios.isAxiosError(error) && !error.response
}

/**
 * True when the backend can't usefully serve us, so the seed dataset should
 * take over. Covers a refused connection, a 5xx (server up, database down),
 * and 403/404 — which is what a stale or proxied deployment answers with. All
 * of them strand the user equally; only a clean 4xx like 401 is a real answer.
 */
export function isApiUnavailable(error: unknown) {
  if (!axios.isAxiosError(error)) return false
  const status = error.response?.status
  if (status === undefined) return true
  return status >= 500 || status === 403 || status === 404
}
