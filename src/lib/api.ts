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
  timeout: 15_000,
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

let retriedOnce = false

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

    return Promise.reject(error)
  },
)

const STATUS_MESSAGES: Record<number, string> = {
  400: 'That request was rejected — check the details and try again.',
  401: 'Your session has expired. Please sign in again.',
  403: 'The AUTOGO API refused that request. If the server is running, check that you are signed in with the right account.',
  404: "That endpoint doesn't exist on the API — the server may be running an older version.",
  409: 'That conflicts with an existing booking.',
  429: 'Too many requests. Give it a moment and try again.',
  503: 'That service is not configured on the server yet.',
}

/**
 * Turns an axios failure into something a person can act on. Prefers the
 * message the Express error handler sent; otherwise maps the status code.
 * Never surfaces raw "Request failed with status code 403".
 */
export function apiError(error: unknown, fallback = 'Something went wrong.') {
  if (axios.isAxiosError(error)) {
    const message = (error.response?.data as { message?: string } | undefined)?.message
    if (message) return message

    if (error.code === 'ECONNABORTED') return 'The server took too long to respond.'
    if (!error.response) return 'Cannot reach the AUTOGO API. Is the server running?'

    const status = error.response.status
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
