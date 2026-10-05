// Enregistre les réponses de l'API de l'ERP (lancée en local avec les données fictives de
// D:\dev\erp-sii\devdb) dans snapshot.json. La démo web rejoue ensuite ces réponses sans serveur.
//   node demos/erp/record.mjs
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { demoKey } from './demo-key.js'

const here = dirname(fileURLToPath(import.meta.url))
const API = 'http://localhost:8080/api/production/'
const login = await (await fetch(API + 'login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'demo@exemple.fr', password: 'demo-erp-2026' }) })).json()
if (!login.token) throw new Error('Connexion impossible : la base et l\'API tournent-elles ? ' + JSON.stringify(login))
const headers = { Authorization: 'Bearer ' + login.token }

const responses = {}
let errors = 0
async function rec(path, params = {}) {
  const key = demoKey(path, params)
  if (key in responses) return responses[key].data
  const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''))
  const res = await fetch(API + path + (q.size ? '?' + q : ''), { headers })
  const data = await res.json().catch(() => null)
  if (res.status >= 400) errors++
  responses[key] = { status: res.status, data }
  return data
}

// Listes et référentiels
for (const p of ['accounts', 'associates/managers', 'associates/all', 'customers', 'genders', 'jobs', 'graduations', 'missions', 'projects', 'pdc/year', 'workeddays/associates', 'associates'])
  await rec(p)
const pages = (await rec('associates', { page: 1 }))?.totalPages || 1
for (let p = 2; p <= pages; p++) await rec('associates', { page: p })

// Fiches
const associates = (await rec('associates/all')).associate
for (const a of associates) { await rec(`associate/${a.id}`); await rec(`associate/${a.id}/all`) }
const customers = (await rec('customers')).customer
for (const c of customers) await rec(`customer/${c.id}`)
await rec('statistiques/customer/actualMonth')
for (const a of (await rec('accounts')).accounts || []) await rec(`simulation/GetFiles/${a.id}`)

// Statistiques, plan de charge et présences, par exercice (avril → mars) et par filtre
// Les statistiques filtrent le manager par id ; le plan de charge et les présences filtrent par
// nom complet (« Prénom NOM »), client et projet par libellé : on reproduit ces valeurs.
const managers = ((await rec('associates/managers')).manager || []).flatMap(job => job.Associates || [])
  .map(m => ({ id: m.id, full: m.first_name + ' ' + m.name }))
const projects = (await rec('projects')).project || []
const filters = [{}, ...managers.map(m => ({ manager: m.full })), ...customers.map(c => ({ customer: c.label })), ...projects.map(p => ({ project: p.label }))]
const now = new Date(), fiscal = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1
for (let year = fiscal - 2; year <= fiscal + 1; year++) {
  await rec('statistiques/agence', { year })
  await rec('statistiques/customer/actualMonth', { year })
  for (const c of customers) await rec(`customer/${c.id}`, { year })
  for (const c of customers) await rec('statistiques/customer', { customer: c.id, year })
  for (const m of managers) await rec('statistiques/manager', { manager: m.id, year })
  for (const f of filters) { await rec('pdc/months', { year, ...f }); await rec('pdc/weeks', { year, ...f }) }
  for (let m = 0; m < 12; m++) {
    const d = new Date(Date.UTC(year, 3 + m, 1)).toISOString().slice(0, 10)
    for (const f of filters) await rec('workeddays/associates', { month: d, ...f })
  }
}

const snapshot = { recordedAt: new Date().toISOString(), account: { id: login.accountId, name: login.accountName }, responses }
writeFileSync(resolve(here, 'snapshot.json'), JSON.stringify(snapshot))
console.log(`${Object.keys(responses).length} réponses enregistrées (${errors} en erreur), ${Math.round(JSON.stringify(snapshot).length / 1024)} Ko`)
