// Faux Firestore en mémoire pour les démos du portfolio.
// Remplace le module `firebase/firestore` au build (alias Vite) : l'application tourne sans
// aucune base réelle. Les données de départ viennent de `@demo-seed` ; les modifications du
// visiteur restent dans son onglet (sessionStorage) et disparaissent à sa fermeture.
import seed from '@demo-seed'

const STORAGE_KEY = 'demo-db:' + (seed.name || 'app')

// ── Timestamp ────────────────────────────────────────────────────────────────
export class Timestamp {
  constructor(seconds, nanoseconds = 0) { this.seconds = seconds; this.nanoseconds = nanoseconds }
  static now() { return Timestamp.fromMillis(Date.now()) }
  static fromDate(d) { return Timestamp.fromMillis(d.getTime()) }
  static fromMillis(ms) { return new Timestamp(Math.floor(ms / 1000), (ms % 1000) * 1e6) }
  toMillis() { return this.seconds * 1000 + Math.floor(this.nanoseconds / 1e6) }
  toDate() { return new Date(this.toMillis()) }
  isEqual(o) { return o instanceof Timestamp && o.toMillis() === this.toMillis() }
  valueOf() { return String(this.toMillis()).padStart(16, '0') }
  toJSON() { return { __ts: this.toMillis() } }
}

// ── Valeurs spéciales ────────────────────────────────────────────────────────
const SENTINEL = Symbol('sentinel')
export const serverTimestamp = () => ({ [SENTINEL]: 'ts' })
export const deleteField = () => ({ [SENTINEL]: 'delete' })
export const increment = n => ({ [SENTINEL]: 'inc', n })
export const arrayUnion = (...v) => ({ [SENTINEL]: 'union', v })
export const arrayRemove = (...v) => ({ [SENTINEL]: 'remove', v })

function clone(v) {
  if (v instanceof Timestamp) return new Timestamp(v.seconds, v.nanoseconds)
  if (v instanceof Date) return Timestamp.fromDate(v)
  if (Array.isArray(v)) return v.map(clone)
  if (v && typeof v === 'object') { const o = {}; for (const k of Object.keys(v)) o[k] = clone(v[k]); return o }
  return v
}
const isPlain = v => v && typeof v === 'object' && (Object.getPrototypeOf(v) === Object.prototype || Object.getPrototypeOf(v) === null) && !v[SENTINEL]
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)

function resolveValue(cur, v) {
  if (v && v[SENTINEL]) {
    switch (v[SENTINEL]) {
      case 'ts': return Timestamp.now()
      case 'inc': return (typeof cur === 'number' ? cur : 0) + v.n
      case 'union': { const a = Array.isArray(cur) ? [...cur] : []; v.v.forEach(x => { if (!a.some(y => same(x, y))) a.push(clone(x)) }); return a }
      case 'remove': return (Array.isArray(cur) ? cur : []).filter(y => !v.v.some(x => same(x, y)))
    }
  }
  if (isPlain(v)) { const o = {}; for (const k of Object.keys(v)) { if (v[k]?.[SENTINEL] === 'delete') continue; o[k] = resolveValue(undefined, v[k]) } return o }
  return clone(v)
}
function deepMerge(target, src) {
  const out = { ...target }
  for (const k of Object.keys(src)) {
    const v = src[k]
    if (v?.[SENTINEL] === 'delete') delete out[k]
    else if (isPlain(v) && isPlain(out[k])) out[k] = deepMerge(out[k], v)
    else out[k] = resolveValue(out[k], v)
  }
  return out
}
function setPath(obj, path, v) {
  const parts = path.split('.'); const last = parts.pop(); let o = obj
  for (const p of parts) { if (!isPlain(o[p])) o[p] = {}; o = o[p] }
  if (v?.[SENTINEL] === 'delete') delete o[last]; else o[last] = resolveValue(o[last], v)
}
const getPath = (obj, path) => path.split('.').reduce((o, p) => (o == null ? undefined : o[p]), obj)

// ── Stockage ─────────────────────────────────────────────────────────────────
const docs = new Map()
function revive(v) {
  if (Array.isArray(v)) return v.map(revive)
  if (v && typeof v === 'object') { if ('__ts' in v && Object.keys(v).length === 1) return Timestamp.fromMillis(v.__ts); const o = {}; for (const k of Object.keys(v)) o[k] = revive(v[k]); return o }
  return v
}
function load() {
  try { const raw = sessionStorage.getItem(STORAGE_KEY); if (raw) { Object.entries(JSON.parse(raw)).forEach(([k, v]) => docs.set(k, revive(v))); return } } catch { /* stockage indisponible */ }
  const data = typeof seed.docs === 'function' ? seed.docs({ Timestamp }) : seed.docs
  Object.entries(data || {}).forEach(([k, v]) => docs.set(k, resolveValue(undefined, v)))
}
let saveT
function persist() {
  clearTimeout(saveT)
  saveT = setTimeout(() => { try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(Object.fromEntries(docs))) } catch { /* quota, navigation privée */ } }, 150)
}
load()
// Chaque démo a son propre sous-domaine : on peut tout effacer (y compris un mot de passe changé par le visiteur).
if (typeof window !== 'undefined') window.__resetDemo = () => { try { sessionStorage.clear(); localStorage.clear() } catch { /* rien */ } location.reload() }

// ── Références ───────────────────────────────────────────────────────────────
let autoId = 0
const newId = () => Date.now().toString(36) + (autoId++).toString(36) + Math.random().toString(36).slice(2, 8)
const join = parts => parts.flatMap(p => String(p).split('/')).filter(Boolean)

class DocumentReference {
  constructor(path) { this.type = 'document'; this.path = path; this.id = path.split('/').pop() }
  get parent() { return new CollectionReference(this.path.split('/').slice(0, -1).join('/')) }
  withConverter() { return this }
}
class CollectionReference {
  constructor(path) { this.type = 'collection'; this.path = path; this.id = path.split('/').pop(); this._c = [] }
  withConverter() { return this }
}
class Query {
  constructor(path, c, group = false) { this.type = 'query'; this.path = path; this._c = c; this._group = group }
  withConverter() { return this }
}

export function getFirestore() { return { type: 'firestore' } }
export const initializeFirestore = getFirestore
export function connectFirestoreEmulator() {}
export async function enableIndexedDbPersistence() {}
export function persistentLocalCache() { return {} }
export function persistentMultipleTabManager() { return {} }

export function doc(base, ...segs) {
  if (base instanceof CollectionReference && segs.length === 0) return new DocumentReference(base.path + '/' + newId())
  const prefix = base instanceof CollectionReference || base instanceof DocumentReference ? [base.path] : []
  return new DocumentReference(join([...prefix, ...segs]).join('/'))
}
export function collection(base, ...segs) {
  const prefix = base instanceof DocumentReference || base instanceof CollectionReference ? [base.path] : []
  return new CollectionReference(join([...prefix, ...segs]).join('/'))
}
export function collectionGroup(_db, id) { return new Query(id, [], true) }

export const where = (field, op, value) => ({ kind: 'where', field, op, value })
export const orderBy = (field, dir = 'asc') => ({ kind: 'orderBy', field, dir })
export const limit = n => ({ kind: 'limit', n })
export const limitToLast = n => ({ kind: 'limitToLast', n })
export const startAt = (...v) => ({ kind: 'noop', v })
export const startAfter = startAt
export const endAt = startAt
export const endBefore = startAt
export const documentId = () => '__name__'
export const and = (...c) => ({ kind: 'and', c })
export const or = (...c) => ({ kind: 'or', c })
export function query(base, ...c) { return new Query(base.path, [...(base._c || []), ...c], base._group) }

// ── Snapshots ────────────────────────────────────────────────────────────────
function docSnap(path) {
  const d = docs.get(path)
  const ref = new DocumentReference(path)
  return { id: ref.id, ref, exists: () => d !== undefined, data: () => (d === undefined ? undefined : clone(d)), get: f => clone(getPath(d || {}, f)), metadata: { hasPendingWrites: false, fromCache: false } }
}
const cmp = (a, b) => {
  const x = a instanceof Timestamp ? a.toMillis() : a, y = b instanceof Timestamp ? b.toMillis() : b
  if (x === y) return 0
  if (x === undefined || x === null) return -1
  if (y === undefined || y === null) return 1
  return x < y ? -1 : 1
}
function test(data, id, c) {
  if (c.kind === 'and') return c.c.every(x => test(data, id, x))
  if (c.kind === 'or') return c.c.some(x => test(data, id, x))
  if (c.kind !== 'where') return true
  const v = c.field === '__name__' ? id : getPath(data, c.field), w = c.value
  switch (c.op) {
    case '==': return same(v, w) || cmp(v, w) === 0
    case '!=': return !(same(v, w) || cmp(v, w) === 0)
    case '<': return v != null && cmp(v, w) < 0
    case '<=': return v != null && cmp(v, w) <= 0
    case '>': return v != null && cmp(v, w) > 0
    case '>=': return v != null && cmp(v, w) >= 0
    case 'in': return w.some(x => same(v, x))
    case 'not-in': return !w.some(x => same(v, x))
    case 'array-contains': return Array.isArray(v) && v.some(x => same(x, w))
    case 'array-contains-any': return Array.isArray(v) && v.some(x => w.some(y => same(x, y)))
  }
  return true
}
function inCollection(path, colPath, group) {
  const parts = path.split('/')
  if (group) return parts.length >= 2 && parts[parts.length - 2] === colPath
  return parts.slice(0, -1).join('/') === colPath
}
function runQuery(q) {
  const c = q._c || []
  let rows = [...docs.keys()].filter(p => inCollection(p, q.path, q._group)).filter(p => c.every(x => test(docs.get(p), p.split('/').pop(), x)))
  const orders = c.filter(x => x.kind === 'orderBy')
  rows.sort((a, b) => {
    for (const o of orders) { const r = cmp(o.field === '__name__' ? a : getPath(docs.get(a), o.field), o.field === '__name__' ? b : getPath(docs.get(b), o.field)); if (r) return o.dir === 'desc' ? -r : r }
    return a < b ? -1 : 1
  })
  const lim = c.find(x => x.kind === 'limit'), last = c.find(x => x.kind === 'limitToLast')
  if (lim) rows = rows.slice(0, lim.n)
  if (last) rows = rows.slice(-last.n)
  const list = rows.map(docSnap)
  return { docs: list, size: list.length, empty: list.length === 0, forEach: f => list.forEach(f), docChanges: () => list.map((d, i) => ({ type: 'added', doc: d, oldIndex: -1, newIndex: i })), metadata: { hasPendingWrites: false, fromCache: false }, query: q }
}

export async function getDoc(ref) { return docSnap(ref.path) }
export const getDocFromCache = getDoc
export const getDocFromServer = getDoc
export async function getDocs(q) { return runQuery(q) }
export const getDocsFromCache = getDocs
export const getDocsFromServer = getDocs
export async function getCountFromServer(q) { const n = runQuery(q).size; return { data: () => ({ count: n }) } }

// ── Écoute temps réel ────────────────────────────────────────────────────────
const listeners = new Set()
function matches(l, path) { return l.target.type === 'document' ? l.target.path === path : inCollection(path, l.target.path, l.target._group) }
function emit(l) { try { l.cb(l.target.type === 'document' ? docSnap(l.target.path) : runQuery(l.target)) } catch (e) { console.error(e) } }
function changed(paths) {
  persist()
  listeners.forEach(l => { if (paths.some(p => matches(l, p))) queueMicrotask(() => listeners.has(l) && emit(l)) })
}
export function onSnapshot(target, ...args) {
  const fns = args.filter(a => typeof a === 'function')
  const obs = args.find(a => a && typeof a === 'object' && (a.next || a.error))
  const cb = fns[0] || obs?.next || (() => {})
  const l = { target, cb }
  listeners.add(l)
  queueMicrotask(() => listeners.has(l) && emit(l))
  return () => listeners.delete(l)
}

// ── Écritures ────────────────────────────────────────────────────────────────
function applySet(ref, data, opts) {
  const cur = docs.get(ref.path)
  docs.set(ref.path, opts && (opts.merge || opts.mergeFields) && cur ? deepMerge(cur, data) : resolveValue(undefined, data))
}
function applyUpdate(ref, data, ...rest) {
  const cur = docs.get(ref.path)
  if (cur === undefined) throw Object.assign(new Error('No document to update: ' + ref.path), { code: 'not-found' })
  const o = clone(cur)
  const entries = typeof data === 'string' ? [[data, rest[0]], ...pairs(rest.slice(1))] : Object.entries(data)
  entries.forEach(([k, v]) => setPath(o, k, v))
  docs.set(ref.path, o)
}
const pairs = a => { const r = []; for (let i = 0; i < a.length; i += 2) r.push([a[i], a[i + 1]]); return r }

export async function setDoc(ref, data, opts) { applySet(ref, data, opts); changed([ref.path]) }
export async function updateDoc(ref, data, ...rest) { applyUpdate(ref, data, ...rest); changed([ref.path]) }
export async function deleteDoc(ref) { docs.delete(ref.path); changed([ref.path]) }
export async function addDoc(col, data) { const ref = doc(col); applySet(ref, data); changed([ref.path]); return ref }

export function writeBatch() {
  const ops = []
  const b = {
    set: (ref, data, opts) => { ops.push(() => applySet(ref, data, opts)); ops.paths = [...(ops.paths || []), ref.path]; return b },
    update: (ref, data, ...rest) => { ops.push(() => applyUpdate(ref, data, ...rest)); ops.paths = [...(ops.paths || []), ref.path]; return b },
    delete: ref => { ops.push(() => docs.delete(ref.path)); ops.paths = [...(ops.paths || []), ref.path]; return b },
    commit: async () => { ops.forEach(f => f()); changed(ops.paths || []) },
  }
  return b
}
export async function runTransaction(_db, fn) {
  const paths = []
  const t = {
    get: async ref => docSnap(ref.path),
    set: (ref, d, o) => { applySet(ref, d, o); paths.push(ref.path); return t },
    update: (ref, d, ...r) => { applyUpdate(ref, d, ...r); paths.push(ref.path); return t },
    delete: ref => { docs.delete(ref.path); paths.push(ref.path); return t },
  }
  const r = await fn(t)
  changed(paths)
  return r
}
