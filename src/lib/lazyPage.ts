import { lazy, type ComponentType } from 'react'

/**
 * Set once when a chunk fails and we reload to recover, so a genuinely broken
 * chunk can't put the browser in a reload loop.
 */
const RELOAD_KEY = 'autogo:chunk-reload'

/**
 * `React.lazy`, but it survives a deploy.
 *
 * Vite gives every chunk a content hash — `Profile-a1b2c3.js` — and a deploy
 * replaces the whole set, deleting the old files. Anyone with the site already
 * open is holding an index.html that points at filenames the server no longer
 * has. The moment they navigate to a route they haven't visited yet, the import
 * 404s, the promise rejects, Suspense never resolves and the page goes blank
 * until they reload by hand. It looks random because it depends on whether a
 * deploy happened while their tab was open.
 *
 * The fix is the reload they would have done themselves: fetch fresh HTML,
 * which points at the chunks that actually exist. Guarded by a session flag so
 * a chunk that is broken for any other reason surfaces to the error boundary
 * on the second attempt instead of reloading forever.
 */
export function lazyPage<T extends ComponentType<unknown>>(
  load: () => Promise<{ default: T }>,
) {
  return lazy(async () => {
    try {
      const module = await load()
      // Got through — clear the guard so a future deploy can recover the same way.
      sessionStorage.removeItem(RELOAD_KEY)
      return module
    } catch (error) {
      if (sessionStorage.getItem(RELOAD_KEY)) {
        // Already tried this. Reloading again would just loop, so let the
        // error boundary show something a person can act on.
        sessionStorage.removeItem(RELOAD_KEY)
        throw error
      }

      sessionStorage.setItem(RELOAD_KEY, '1')
      window.location.reload()

      // The page is being torn down. Never resolving keeps the Suspense
      // spinner up rather than flashing an error on the way out.
      return new Promise<never>(() => {})
    }
  })
}
