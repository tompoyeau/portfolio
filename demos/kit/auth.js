// Remplace `firebase/auth` dans les démos : le visiteur est connecté d'office avec le compte
// de démonstration défini dans `@demo-seed` (champ `user`). Tout identifiant est accepté.
import seed from '@demo-seed'

const demoUser = { uid: 'demo', email: 'demo@exemple.fr', displayName: 'Démo', emailVerified: true, ...(seed.user || {}) }
const KEY = 'demo-auth:' + (seed.name || 'app')
const listeners = new Set()

function signedOut() { try { return sessionStorage.getItem(KEY) === 'out' } catch { return false } }
function setSignedOut(v) { try { v ? sessionStorage.setItem(KEY, 'out') : sessionStorage.removeItem(KEY) } catch { /* rien */ } }

const user = () => ({ ...demoUser, getIdToken: async () => 'demo', getIdTokenResult: async () => ({ claims: {} }), reload: async () => {} })
const auths = []
export function getAuth() {
  const a = { currentUser: signedOut() ? null : user(), signOut: () => signOut(a) }
  auths.push(a)
  return a
}
export const initializeAuth = getAuth
export function connectAuthEmulator() {}
export async function setPersistence() {}
export const browserLocalPersistence = {}
export const browserSessionPersistence = {}
export const inMemoryPersistence = {}
export const getReactNativePersistence = () => ({})
export async function signInWithCredential() { return signInWithEmailAndPassword() }

function emit() { const u = signedOut() ? null : user(); auths.forEach(a => { a.currentUser = u }); listeners.forEach(cb => cb(u)) }
export function onAuthStateChanged(_auth, cb) {
  const fn = typeof cb === 'function' ? cb : cb.next
  listeners.add(fn)
  queueMicrotask(() => fn(signedOut() ? null : user()))
  return () => listeners.delete(fn)
}
export const onIdTokenChanged = onAuthStateChanged
export async function signInWithEmailAndPassword() { setSignedOut(false); emit(); return { user: user() } }
export async function signOut() { setSignedOut(true); emit() }
export async function createUserWithEmailAndPassword(_a, email) { return { user: { uid: 'u' + Date.now().toString(36), email } } }
export async function sendPasswordResetEmail() {}
export async function updatePassword() {}
export async function updateProfile() {}
export class GoogleAuthProvider { setCustomParameters() {} }
export async function signInWithPopup() { return signInWithEmailAndPassword() }
