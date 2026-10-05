// Clé unique d'une requête de l'ERP, partagée par l'enregistreur (record.mjs) et le faux serveur
// du navigateur (setup.js) : « associate/3/all », « pdc/months?manager=1&year=2026 »…
// - on retire l'origine et le préfixe /api/<environnement> (l'interface en écrit certains en dur) ;
// - les paramètres vides sont ignorés (axios n'envoie pas null/undefined, mais envoie « search= ») ;
// - les paramètres sont triés.
export function demoKey(url, params = {}) {
  const u = new URL(url, 'http://demo')
  let path = u.pathname.replace(/^\/api\/[^/]+/, '').replace(/\/{2,}/g, '/').replace(/^\/|\/$/g, '')
  const all = {}
  u.searchParams.forEach((v, k) => { all[k] = v })
  Object.entries(params || {}).forEach(([k, v]) => { all[k] = v })
  const q = Object.keys(all).filter(k => all[k] !== undefined && all[k] !== null && all[k] !== '').sort()
    .map(k => `${k}=${all[k]}`).join('&')
  return q ? `${path}?${q}` : path
}
