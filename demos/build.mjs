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

// Statistiques de visite (Umami auto-hébergé, sans cookie) : pages vues automatiques et clics
// marqués `data-umami-event`. `data-domains` : rien n'est compté en local (wrangler dev).
// Hélio n'est pas ici : il embarque son propre suivi (vue-app/src/analytics.ts).
const STATS = {
  resto: ['6d23e235-9440-4c31-9bb9-f6ce1c831e1d', 'resto.topo-host.com'],
  bloom: ['41efdad6-7e17-40ce-b824-46b5fe837bb7', 'bloom.topo-host.com'],
}
const statsAttrs = ([id, domain]) => ({ defer: true, src: 'https://stats.topo-host.com/t.js', 'data-website-id': id, 'data-domains': domain })
const statsTag = s => '<script ' + Object.entries(statsAttrs(s)).map(([k, v]) => v === true ? k : `${k}="${v}"`).join(' ') + '></script>'
const ev = (stats, name) => stats ? ` data-umami-event="${name}"` : ''
const barButtons = stats => ` <button type="button" onclick="window.__resetDemo&&window.__resetDemo()"${ev(stats, 'Réinitialiser la démo')}>Réinitialiser</button> <a href="https://topo-host.com/"${ev(stats, 'Retour au portfolio')}>Portfolio</a>`

// Bandeau « démo » ajouté en haut de chaque page (et les statistiques, si la démo en a).
function banner(html, stats) {
  return {
    name: 'demo-banner',
    transformIndexHtml: { order: 'post', handler: () => [
      { tag: 'style', children: '#demo-bar{position:fixed;z-index:2147483000;left:12px;bottom:calc(12px + env(safe-area-inset-bottom,0px));max-width:calc(100% - 24px);display:flex;flex-wrap:wrap;align-items:center;gap:6px 12px;padding:8px 12px;border-radius:8px;background:#151a17;color:#f1f2ee;font:500 13px/1.4 system-ui,sans-serif;box-shadow:0 6px 24px rgba(0,0,0,.25)}#demo-bar a,#demo-bar button{color:#b9c6ff;background:none;border:0;padding:0;font:inherit;cursor:pointer;text-decoration:underline;text-underline-offset:2px}#demo-bar b{font-weight:700}', injectTo: 'head' },
      { tag: 'div', attrs: { id: 'demo-bar', role: 'note' }, children: html + barButtons(stats), injectTo: 'body' },
      ...(stats ? [{ tag: 'script', attrs: statsAttrs(stats), injectTo: 'head' }] : []),
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
      plugins: [vue(), banner('<b>Démo</b> · restaurant fictif, tous les modules activés. Espace gérant : <a href="/admin" data-umami-event="Espace gérant (bandeau)">/admin</a>, mot de passe <b>admin</b>.', STATS.resto)],
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
    + '<div id="demo-bar" role="note"><b>Démo</b> · vous êtes Alex, qui prépare la surprise de Camille. Tout est fictif.' + barButtons(STATS.bloom) + '</div>'
  const walk = d => readdirSync(d).forEach(f => { const p = resolve(d, f); if (statSync(p).isDirectory()) walk(p); else if (p.endsWith('.html')) writeFileSync(p, readFileSync(p, 'utf8').replace('</head>', statsTag(STATS.bloom) + '</head>').replace('</body>', bar + '</body>')) })
  walk(out)
}

// La Truffe Gourmande est un site statique sans build : on copie seulement les pages et `assets/`
// (pas le README ni le dossier .git du dépôt).
demos.truffe = async function truffe() {
  const { cpSync, rmSync, readdirSync } = await import('node:fs')
  const root = resolve(here, '../../truffe-gourmande')
  const out = resolve(here, 'truffe/dist')
  rmSync(out, { recursive: true, force: true })
  cpSync(resolve(root, 'assets'), resolve(out, 'assets'), { recursive: true })
  readdirSync(root).filter(f => f.endsWith('.html')).forEach(f => cpSync(resolve(root, f), resolve(out, f)))
}

// ERP SII (« Picsou ») : Vue CLI, donc pas d'alias Vite. Le temps du build, on copie le faux serveur
// (demos/erp/setup.js + snapshot.json) dans front/src/__demo__ et on l'importe en tête de main.js,
// puis on remet main.js tel quel. Les réponses viennent de demos/erp/record.mjs.
demos.erp = async function erp() {
  const { readFileSync, writeFileSync, cpSync, rmSync } = await import('node:fs')
  const { execSync } = await import('node:child_process')
  const root = resolve(here, '../../erp-sii/front')
  const out = resolve(here, 'erp/dist')
  const tmp = resolve(root, 'src/__demo__')
  // Retouches propres à la démo, présentée sous le nom « Picsou » sans le nom ni le logo de SII.
  // Elles ne durent que le temps du build : chaque fichier est remis tel quel ensuite.
  const LOGO = '../assets/img/Piscou-logo-primaire-svg.svg', DEMO_LOGO = '../__demo__/picsou-logo.svg'
  const patches = {
    'src/main.js': [['import { createApp }', "import './__demo__/setup'\nimport { createApp }"]],
    'public/index.html': [['<title>SII | PICSOU</title>', '<title>Picsou</title>']],
    'src/components/MyToolbar.vue': [[LOGO, DEMO_LOGO]],
    'src/components/Connexion.vue': [[LOGO, DEMO_LOGO]],
    'src/components/Dashboard.vue': [['Total de collaborateurs SII Le Mans', 'Total de collaborateurs']],
    'src/components/Client.vue': [['Clients SII Le Mans', 'Clients']],
    'src/components/Collaborateurs.vue': [['Collaborateurs SII Le Mans', 'Collaborateurs']],
    'src/components/Pdc.vue': [['Hors SII', 'Hors effectif']],
    'src/components/forms/add/AddCollabForm.vue': [['@sii.fr', '@exemple.fr']],
    'src/components/forms/update/UpdateCollabForm.vue': [['@sii.fr', '@exemple.fr']],
  }
  const originals = {}
  try {
    for (const f of ['setup.js', 'demo-key.js', 'snapshot.json', 'picsou-logo.svg']) cpSync(resolve(here, 'erp', f), resolve(tmp, f))
    for (const [file, list] of Object.entries(patches)) {
      const p = resolve(root, file)
      let text = originals[p] = readFileSync(p, 'utf8')
      for (const [from, to] of list) {
        if (!text.includes(from)) throw new Error(`Retouche introuvable dans ${file} : ${from}`)
        text = text.split(from).join(to)
      }
      writeFileSync(p, text)
    }
    execSync(`npx vue-cli-service build --dest "${out}"`, { cwd: root, stdio: 'inherit' })
  } finally {
    for (const [p, text] of Object.entries(originals)) writeFileSync(p, text)
    rmSync(tmp, { recursive: true, force: true })
  }
  const recorded = new Date(JSON.parse(readFileSync(resolve(here, 'erp/snapshot.json'), 'utf8')).recordedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  const bar = '<style>#demo-bar{position:fixed;z-index:2147483000;right:12px;bottom:calc(12px + env(safe-area-inset-bottom,0px));max-width:calc(100% - 24px);display:flex;flex-wrap:wrap;align-items:center;gap:6px 12px;padding:8px 12px;border-radius:8px;background:#151a17;color:#f1f2ee;font:500 13px/1.4 system-ui,sans-serif;box-shadow:0 6px 24px rgba(0,0,0,.25)}#demo-bar a{color:#b9c6ff}</style>'
    + `<div id="demo-bar" role="note"><b>Démo</b> · données fictives, figées au ${recorded}. Les modifications ne sont pas enregistrées. <a href="https://topo-host.com/">Portfolio</a></div>`
  const index = resolve(out, 'index.html')
  writeFileSync(index, readFileSync(index, 'utf8').replace('</body>', bar + '</body>'))
}

if (!demos[name]) { console.error('Démo inconnue. Choix : ' + Object.keys(demos).join(', ')); process.exit(1) }
await demos[name]()
console.log('Démo « ' + name + ' » compilée dans demos/' + name + '/dist')
