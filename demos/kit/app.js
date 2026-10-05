// Remplace `firebase/app` dans les démos : aucune connexion à Firebase.
const app = { name: '[DEFAULT]', options: {} }
export function initializeApp(options = {}) { app.options = options; return app }
export function getApp() { return app }
export function getApps() { return [app] }
export function deleteApp() { return Promise.resolve() }
export class FirebaseError extends Error {
  constructor(code, message) { super(message); this.code = code; this.name = 'FirebaseError' }
}
