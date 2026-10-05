// Produit le CV en PDF à partir de cv.html avec Chrome sans fenêtre, et signale tout débordement de la page A4.
//   node cv/build-pdf.mjs
import { spawn } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const OUTS = [resolve(here, '../public/cv-tom-poyeau.pdf'), 'C:/Users/tompo/OneDrive/Documents/Lettre et CV/CV/CV de Tom Poyeau 2026 - portfolio.pdf']
const port = 9337
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'cv-'))}`, 'about:blank'], { stdio: 'ignore' })
const sleep = ms => new Promise(r => setTimeout(r, ms))
let t; for (let i = 0; i < 50 && !t; i++) { try { t = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find(x => x.type === 'page') } catch { await sleep(200) } }
const ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise(r => ws.addEventListener('open', r))
let id = 0; const p = new Map()
ws.addEventListener('message', e => { const m = JSON.parse(e.data); if (m.id && p.has(m.id)) { p.get(m.id)(m); p.delete(m.id) } })
const send = (method, params = {}) => new Promise(r => { const i = ++id; p.set(i, r); ws.send(JSON.stringify({ id: i, method, params })) })
const evalJs = async e => (await send('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true })).result.result.value

await send('Page.navigate', { url: pathToFileURL(resolve(here, 'cv.html')).href })
await sleep(1500)
await evalJs('document.fonts.ready.then(() => true)')
const check = await evalJs(`JSON.stringify([...document.querySelectorAll('main, aside')].map(e => ({ zone: e.tagName, contenu: e.scrollHeight, page: e.clientHeight })))`)
console.log('Hauteurs (px) :', check)
const fonts = await evalJs(`[...document.fonts].filter(f => f.status === 'loaded').map(f => f.family).filter((v, i, a) => a.indexOf(v) === i).join(', ')`)
console.log('Polices chargées :', fonts)
const pdf = await send('Page.printToPDF', { printBackground: true, preferCSSPageSize: true, marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0 })
for (const out of OUTS) { writeFileSync(out, Buffer.from(pdf.result.data, 'base64')); console.log('PDF :', out) }
const png = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: 0, width: 794, height: 1123, scale: 1 } })
writeFileSync(resolve(here, 'apercu.png'), Buffer.from(png.result.data, 'base64'))
ws.close(); chrome.kill()
