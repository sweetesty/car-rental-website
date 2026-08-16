import { initializeApp, type FirebaseApp } from 'firebase/app'
import {
  GoogleAuthProvider,
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  getAuth,
  getRedirectResult,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  verifyPasswordResetCode,
  confirmPasswordReset,
  applyActionCode,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  updateProfile,
  type Auth,
  type User as FirebaseUser,
} from 'firebase/auth'

/**
 * Firebase is configured entirely through `VITE_FIREBASE_*` env vars. When they
 * are absent — a fresh clone, or a demo build — `auth` stays null and the app
 * falls back to the bundled seed accounts instead of crashing at import time.
 * This mirrors how the server skips Firebase Admin init without its own vars.
 */
const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const firebaseConfigured = Boolean(config.apiKey && config.projectId && config.appId)

let app: FirebaseApp | null = null
let auth: Auth | null = null

if (firebaseConfigured) {
  app = initializeApp(config)
  auth = getAuth(app)
} else {
  console.warn(
    '[AUTOGO] Firebase env vars missing — signing in against the bundled demo accounts. ' +
      'Set VITE_FIREBASE_* in client/.env for live auth.',
  )
}

export { auth }

/** Fresh ID token for the Authorization header, or null when signed out. */
export async function currentIdToken(forceRefresh = false) {
  const user = auth?.currentUser
  if (!user) return null
  try {
    return await user.getIdToken(forceRefresh)
  } catch {
    return null
  }
}

export function watchAuth(callback: (user: FirebaseUser | null) => void) {
  if (!auth) {
    // Nothing to watch — report "signed out" once so callers stop waiting.
    callback(null)
    return () => {}
  }
  return onAuthStateChanged(auth, callback)
}

/**
 * Controls how long a session outlives the browser.
 *
 * `local` keeps the user signed in after the browser is closed; `session`
 * clears it when the tab does. Must be set BEFORE signing in — Firebase
 * applies persistence at the moment credentials are exchanged.
 *
 * This is what makes the "Keep me signed in" checkbox mean something. Without
 * it Firebase always uses `local`, so a person unticking the box on a shared
 * phone would stay signed in regardless — a promise the UI was making and
 * quietly breaking.
 */
export async function setSessionPersistence(keepSignedIn: boolean) {
  if (!auth) return
  try {
    await setPersistence(auth, keepSignedIn ? browserLocalPersistence : browserSessionPersistence)
  } catch {
    // Private browsing can block storage; the sign-in itself should still work.
  }
}

export async function signInWithPassword(email: string, password: string) {
  if (!auth) throw new Error('Firebase is not configured.')
  const credential = await signInWithEmailAndPassword(auth, email, password)
  return credential.user
}

export async function registerWithPassword(email: string, password: string, name: string) {
  if (!auth) throw new Error('Firebase is not configured.')
  const credential = await createUserWithEmailAndPassword(auth, email, password)
  // Set it now so the server's /sync can read a real name off the token.
  await updateProfile(credential.user, { displayName: name })
  return credential.user
}

/**
 * Google sign-in, popup first and redirect as a fallback.
 *
 * Popups are unreliable on mobile: in-app browsers (Instagram, Facebook,
 * WhatsApp) block them outright, and iOS Safari blocks any popup it decides
 * wasn't opened directly by a tap. Falling back to a full-page redirect makes
 * the flow work in those cases — it just returns via getRedirectResult on the
 * next page load instead of resolving here.
 */
export async function signInWithGoogle() {
  if (!auth) throw new Error('Firebase is not configured.')

  const provider = new GoogleAuthProvider()
  // Always ask which account, rather than silently reusing the last one.
  provider.setCustomParameters({ prompt: 'select_account' })

  try {
    const credential = await signInWithPopup(auth, provider)
    return credential.user
  } catch (error) {
    const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : ''
    const popupUnavailable =
      code === 'auth/popup-blocked' ||
      code === 'auth/operation-not-supported-in-this-environment' ||
      code === 'auth/cancelled-popup-request'

    if (!popupUnavailable) throw error

    // Never resolves — the browser navigates away and comes back signed in.
    await signInWithRedirect(auth, provider)
    return null as never
  }
}

/**
 * Completes a redirect sign-in after the browser returns. Safe to call on
 * every load; resolves to null when there is no redirect in progress.
 */
export async function completeRedirectSignIn() {
  if (!auth) return null
  try {
    const credential = await getRedirectResult(auth)
    return credential?.user ?? null
  } catch {
    return null
  }
}

export async function firebaseSignOut() {
  if (auth) await signOut(auth)
}

/**
 * Sends a genuine password-reset email via Firebase.
 *
 * Firebase sends and hosts the reset page itself — nothing to build, and the
 * link is single-use and time-limited. Accounts created through Google have no
 * password to reset, so the caller should say so rather than send nothing.
 */
export async function sendPasswordReset(email: string) {
  if (!auth) throw new Error('Firebase is not configured.')
  await sendPasswordResetEmail(auth, email)
}

/*
 * Handlers for the links Firebase mints.
 *
 * Firebase normally hosts this step itself, on
 * <project>.firebaseapp.com/__/auth/action — which shows customers the
 * internal project id and takes them off autogo.ng mid-recovery. Pointing the
 * action URL at our own page means these three do the work instead.
 */

/** Checks a reset code is valid and unused, and returns whose account it is. */
export async function checkResetCode(code: string) {
  if (!auth) throw new Error('Firebase is not configured.')
  return verifyPasswordResetCode(auth, code)
}

/** Sets the new password. The code is single-use and dies here. */
export async function completePasswordReset(code: string, newPassword: string) {
  if (!auth) throw new Error('Firebase is not configured.')
  await confirmPasswordReset(auth, code, newPassword)
}

/** Applies an email-verification code. */
export async function applyEmailAction(code: string) {
  if (!auth) throw new Error('Firebase is not configured.')
  await applyActionCode(auth, code)
}

/** True when the signed-in account uses Google rather than a password. */
export function isGoogleAccount() {
  return auth?.currentUser?.providerData.some((p) => p.providerId === 'google.com') ?? false
}

/** Firebase error codes are machine-readable; users need sentences. */
const AUTH_MESSAGES: Record<string, string> = {
  'auth/invalid-credential': 'Incorrect email or password.',
  'auth/invalid-email': 'That email address is not valid.',
  'auth/user-not-found': 'No account found with that email.',
  'auth/wrong-password': 'Incorrect email or password.',
  'auth/email-already-in-use': 'An account with that email already exists.',
  'auth/weak-password': 'Choose a password of at least 8 characters.',
  'auth/too-many-requests': 'Too many attempts. Try again in a few minutes.',
  'auth/popup-closed-by-user': 'Sign-in was cancelled.',
  'auth/network-request-failed': 'Network problem — check your connection and try again.',
  // Names the console setting to check, rather than saying "email" for what is
  // usually a disabled Google provider.
  'auth/operation-not-allowed':
    'That sign-in method is switched off. Enable it in Firebase → Authentication → Sign-in method.',
  'auth/unauthorized-domain':
    'This website address is not on the Firebase authorised domains list.',
  'auth/popup-blocked': 'Your browser blocked the sign-in window. Allow pop-ups and try again.',
  'auth/account-exists-with-different-credential':
    'You already have an account with that email. Sign in with your password instead.',
  'auth/invalid-api-key': 'The Firebase configuration on this site is invalid.',
}

export function firebaseError(error: unknown) {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = String((error as { code: unknown }).code)
    if (AUTH_MESSAGES[code]) return AUTH_MESSAGES[code]
  }
  return error instanceof Error ? error.message : 'Sign-in failed.'
}
