// Démo web de l'ERP : ce fichier est importé en tout premier par main.js au moment du build
// (voir demos/build.mjs). Il remplace le serveur par les réponses enregistrées dans snapshot.json.
import axios from 'axios'
import snapshot from './snapshot.json'
import { demoKey } from './demo-key'

const R = snapshot.responses

// 1. Horloge figée à la date de l'enregistrement : « aujourd'hui », l'exercice en cours et les
//    statistiques restent cohérents avec les données, quel que soit le jour de la visite.
const RealDate = Date
const OFFSET = RealDate.parse(snapshot.recordedAt) - RealDate.now()
class DemoDate extends RealDate {
  constructor(...args) { if (args.length) super(...args); else super(RealDate.now() + OFFSET) }
  static now() { return RealDate.now() + OFFSET }
}
globalThis.Date = DemoDate

// 2. Visiteur connecté d'office avec le compte de démonstration.
localStorage.setItem('token', 'demo')
localStorage.setItem('userId', String(snapshot.account.id))
localStorage.setItem('userName', snapshot.account.name)
localStorage.setItem('connected', 'true')
if (localStorage.getItem('isSimulation') === null) localStorage.setItem('isSimulation', 'false')
if (!location.hash || location.hash === '#' || location.hash === '#/') location.replace('#/dashboard')

// 3. Faux serveur : rejoue les lectures, accepte les écritures sans les enregistrer.
function toast(text) {
  let el = document.getElementById('demo-toast')
  if (!el) {
    el = document.createElement('div')
    el.id = 'demo-toast'
    el.setAttribute('role', 'status')
    el.style.cssText = 'position:fixed;z-index:2147483001;left:50%;top:16px;transform:translateX(-50%);max-width:calc(100% - 32px);padding:10px 16px;border-radius:8px;background:#151a17;color:#f1f2ee;font:500 14px/1.4 system-ui,sans-serif;box-shadow:0 6px 24px rgba(0,0,0,.25)'
    document.body.append(el)
  }
  el.textContent = text
  el.hidden = false
  clearTimeout(toast.t)
  toast.t = setTimeout(() => { el.hidden = true }, 3500)
}

// Filtres libres (recherche) ou combinaisons non enregistrées : on retombe sur la vue sans filtre.
function candidates(key) {
  const [path, query = ''] = key.split('?')
  const params = new URLSearchParams(query)
  const list = [key]
  for (const drop of ['search', 'project', 'customer', 'manager', 'page']) {
    if (!params.has(drop)) continue
    params.delete(drop)
    const q = params.toString()
    list.push(q ? `${path}?${decodeURIComponent(q)}` : path)
  }
  list.push(path)
  return list
}

axios.defaults.adapter = async config => {
  const method = (config.method || 'get').toLowerCase()
  const full = /^https?:/.test(config.url) ? config.url : (config.baseURL || '').replace(/\/$/, '') + '/' + String(config.url).replace(/^\//, '')
  const key = demoKey(full, config.params)
  const reply = (status, data) => {
    const response = { data, status, statusText: String(status), headers: {}, config, request: {} }
    if (status >= 400) {
      const err = new Error('Request failed with status code ' + status)
      Object.assign(err, { response, config, isAxiosError: true })
      throw err
    }
    return response
  }
  await new Promise(r => setTimeout(r, 80))

  if (method === 'get') {
    if (key.startsWith('simulation/GetFiles')) return reply(200, { userId: snapshot.account.id, files: [], currentPage: 1, totalPages: 0 })
    for (const k of candidates(key)) if (R[k]) return reply(R[k].status, R[k].data)
    return reply(404, { error: 'Donnée indisponible dans la démo' })
  }
  if (key === 'login') return reply(201, { accountId: snapshot.account.id, accountName: snapshot.account.name, token: 'demo' })
  toast('Démo : la modification est acceptée mais pas enregistrée.')
  return reply(201, { message: 'Démo : modification non enregistrée' })
}
