// Compile une démo à partir du code d'un projet voisin, sans rien écrire dans son dépôt.
// Firebase y est remplacé par le faux Firestore du dossier `kit/`.
//   node demos/build.mjs resto
//   node demos/build.mjs helio
import { resolve, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { existsSync } from 'node:fs'

const here = dirname(fileURLToPath(import.meta.url))
const kit = f => resolve(here, 'kit', f)
const name = process.argv[2]

// Chargé depuis le projet compilé : les démos utilisent ses propres versions de Vite et des plugins.
async function load(root, ...candidates) {
  for (const c of candidates) {
    const p = resolve(root, 'node_modules', c)
    if (existsSync(p)) { const m = await import(pathToFileURL(p).href); return m.default ?? m }
  }
  throw new Error('Introuvable dans ' + root + ' : ' + candidates.join(', '))
}

// Bandeau « démo » ajouté en haut de chaque page.
function banner(html) {
  return {
    name: 'demo-banner',
    transformIndexHtml: { order: 'post', handler: () => [
      { tag: 'style', children: '#demo-bar{position:fixed;z-index:2147483000;left:12px;bottom:calc(12px + env(safe-area-inset-bottom,0px));max-width:calc(100% - 24px);display:flex;flex-wrap:wrap;align-items:center;gap:6px 12px;padding:8px 12px;border-radius:8px;background:#151a17;color:#f1f2ee;font:500 13px/1.4 system-ui,sans-serif;box-shadow:0 6px 24px rgba(0,0,0,.25)}#demo-bar a,#demo-bar button{color:#b9c6ff;background:none;border:0;padding:0;font:inherit;cursor:pointer;text-decoration:underline;text-underline-offset:2px}#demo-bar b{font-weight:700}', injectTo: 'head' },
      { tag: 'div', attrs: { id: 'demo-bar', role: 'note' }, children: html + ' <button type="button" onclick="window.__resetDemo&&window.__resetDemo()">Réinitialiser</button> <a href="https://topo-host.com/">Portfolio</a>', injectTo: 'body' },
    ] },
  }
}

const demos = {
  async resto() {
    const root = resolve(here, '../../laromate')
    const { build } = await load(root, 'vite/dist/node/index.js')
    const vue = await load(root, '@vitejs/plugin-vue/dist/index.mjs', '@vitejs/plugin-vue/dist/index.cjs')
    const FEATURES = ['reservations', 'menu', 'gallery', 'reviews', 'promotions', 'qrcode', 'schemaOrg']
    const define = { __FEATURES__: JSON.stringify(FEATURES) }
    FEATURES.forEach(k => { define[`__FEAT_${k.toUpperCase()}__`] = 'true' })
    return build({
      configFile: false, root, base: '/', mode: 'production', logLevel: 'warn', envDir: kit(''), // aucun .env du projet (vraie config Firebase)
      plugins: [vue(), banner('<b>Démo</b> · restaurant fictif, tous les modules activés. Espace gérant : <a href="/admin">/admin</a>, mot de passe <b>admin</b>.')],
      define,
      resolve: { alias: {
        '@demo-seed': resolve(here, 'resto/seed.js'),
        'firebase/firestore': kit('firestore.js'), 'firebase/app': kit('app.js'), 'firebase/storage': kit('storage.js'),
        '@': resolve(root, 'src'),
      } },
      build: { outDir: resolve(here, 'resto/dist'), emptyOutDir: true },
    })
  },

  async helio() {
    const root = resolve(here, '../../helpdesk/vue-app')
    const { build } = await load(root, 'vite/dist/node/index.js')
    const vue = await load(root, '@vitejs/plugin-vue/dist/index.mjs', '@vitejs/plugin-vue/dist/index.cjs')
    const tailwind = await load(root, '@tailwindcss/vite/dist/index.mjs')
    // Pas de PWA ni de service worker pour la démo : rien ne doit rester en cache chez le visiteur.
    return build({
      configFile: false, root, base: '/', mode: 'production', logLevel: 'warn', envDir: kit(''), // aucun .env du projet (vraie config Firebase)
      plugins: [tailwind(), vue(), banner('<b>Démo</b> · équipe et plannings fictifs, connecté en administratrice. Vos changements restent dans cet onglet.')],
      resolve: { alias: {
        '@demo-seed': resolve(here, 'helio/seed.js'),
        'firebase/firestore': kit('firestore.js'), 'firebase/app': kit('app.js'), 'firebase/auth': kit('auth.js'),
        '@': resolve(root, 'src'),
      } },
      build: { outDir: resolve(here, 'helio/dist'), emptyOutDir: true },
    })
  },
}

// Bloom est compilé par Metro (Expo), pas par Vite : Metro n'accepte pas d'autre fichier de
// configuration. Le temps de l'export, on ajoute donc la redirection vers le faux Firebase à
// la fin de `metro.config.js` et on passe le web en mode « single » (application d'une page)
// dans `app.json`, puis on remet les deux fichiers exactement comme ils étaient.
demos.bloom = async function bloom() {
  const { readFileSync, writeFileSync, readdirSync, statSync } = await import('node:fs')
  const { execSync } = await import('node:child_process')
  const root = resolve(here, '../../bloom')
  const out = resolve(here, 'bloom/dist')
  const metroPath = resolve(root, 'metro.config.js'), appPath = resolve(root, 'app.json')
  const metro = readFileSync(metroPath, 'utf8'), app = readFileSync(appPath, 'utf8')
  // Metro ne lit que les fichiers du projet : on copie le faux Firebase dans node_modules le temps de l'export.
  const { cpSync, rmSync } = await import('node:fs')
  const tmp = resolve(root, 'node_modules/.portfolio-demo')
  cpSync(resolve(here, 'kit'), tmp, { recursive: true })
  cpSync(resolve(here, 'bloom/seed.js'), resolve(tmp, 'seed.js'))
  const aliases = {
    'firebase/firestore': resolve(tmp, 'firestore.js'), 'firebase/app': resolve(tmp, 'app.js'), 'firebase/auth': resolve(tmp, 'auth.js'),
    '@demo-seed': resolve(tmp, 'seed.js'),
  }
  const hook = `
// --- démo portfolio (ajout temporaire, retiré après l'export) ---
{ const aliases = ${JSON.stringify(aliases)}; const prev = config.resolver.resolveRequest;
  config.resolver.resolveRequest = (ctx, name, platform) => aliases[name] ? { type: 'sourceFile', filePath: aliases[name] } : (prev || ctx.resolveRequest)(ctx, name, platform); }
`
  const appJson = JSON.parse(app)
  appJson.expo.web = { ...appJson.expo.web, output: 'single' }
  try {
    writeFileSync(metroPath, metro.replace(/module\.exports = config;\s*$/, hook + '\nmodule.exports = config;\n'))
    writeFileSync(appPath, JSON.stringify(appJson, null, 2) + '\n')
    execSync(`npx expo export -p web --clear --output-dir "${out}"`, { cwd: root, stdio: 'inherit' })
  } finally {
    writeFileSync(metroPath, metro)
    writeFileSync(appPath, app)
    rmSync(tmp, { recursive: true, force: true })
  }
  // Bandeau de démo dans chaque page HTML produite.
  const bar = '<style>#demo-bar{position:fixed;z-index:2147483000;left:12px;bottom:calc(12px + env(safe-area-inset-bottom,0px));max-width:calc(100% - 24px);display:flex;flex-wrap:wrap;align-items:center;gap:6px 12px;padding:8px 12px;border-radius:8px;background:#151a17;color:#f1f2ee;font:500 13px/1.4 system-ui,sans-serif;box-shadow:0 6px 24px rgba(0,0,0,.25)}#demo-bar a,#demo-bar button{color:#b9c6ff;background:none;border:0;padding:0;font:inherit;cursor:pointer;text-decoration:underline}</style>'
    + '<div id="demo-bar" role="note"><b>Démo</b> · vous êtes Alex, qui prépare la surprise de Camille. Tout est fictif. <button type="button" onclick="window.__resetDemo&&window.__resetDemo()">Réinitialiser</button> <a href="https://topo-host.com/">Portfolio</a></div>'
  const walk = d => readdirSync(d).forEach(f => { const p = resolve(d, f); if (statSync(p).isDirectory()) walk(p); else if (p.endsWith('.html')) writeFileSync(p, readFileSync(p, 'utf8').replace('</body>', bar + '</body>')) })
  walk(out)
}

if (!demos[name]) { console.error('Démo inconnue. Choix : ' + Object.keys(demos).join(', ')); process.exit(1) }
await demos[name]()
console.log('Démo « ' + name + ' » compilée dans demos/' + name + '/dist')
