// Remplace `firebase/storage` dans les démos : les fichiers restent dans le navigateur.
const files = new Map()
export function getStorage() { return { type: 'storage' } }
export function ref(_s, path = '') { return { fullPath: path, name: path.split('/').pop() } }
export async function uploadBytes(r, data) { files.set(r.fullPath, URL.createObjectURL(data instanceof Blob ? data : new Blob([data]))); return { ref: r } }
export const uploadBytesResumable = (r, data) => {
  const p = uploadBytes(r, data)
  return { on: (_e, _n, err, done) => p.then(() => done && done(), err), then: (...a) => p.then(...a), snapshot: { ref: r } }
}
export async function uploadString(r, s) { files.set(r.fullPath, s); return { ref: r } }
export async function getDownloadURL(r) { return files.get(r.fullPath) || '' }
export async function deleteObject(r) { files.delete(r.fullPath) }
