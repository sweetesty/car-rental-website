import { initializeApp, type FirebaseApp } from 'firebase/app'
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
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

export async function signInWithGoogle() {
  if (!auth) throw new Error('Firebase is not configured.')
  const credential = await signInWithPopup(auth, new GoogleAuthProvider())
  return credential.user
}

export async function firebaseSignOut() {
  if (auth) await signOut(auth)
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
  'auth/operation-not-allowed': 'Email sign-in is not enabled on this Firebase project.',
}

export function firebaseError(error: unknown) {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = String((error as { code: unknown }).code)
    if (AUTH_MESSAGES[code]) return AUTH_MESSAGES[code]
  }
  return error instanceof Error ? error.message : 'Sign-in failed.'
}
