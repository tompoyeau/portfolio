// Thème du site : clair par défaut, sombre sur demande. Le choix est retenu dans le navigateur du visiteur
// et partagé par toutes les pages de topo-host.com. Chargé en tête de page pour éviter un flash de couleur.
(() => {
  const KEY = 'theme'
  let current = 'light'
  try { if (localStorage.getItem(KEY) === 'dark') current = 'dark' } catch { /* stockage indisponible */ }
  document.documentElement.dataset.theme = current

  // Bouton(s) de bascule : tout élément portant data-theme-toggle (texte dans data-theme-label).
  const sync = () => document.querySelectorAll('[data-theme-toggle]').forEach(b => {
    b.setAttribute('aria-pressed', String(current === 'dark'))
    const text = b.querySelector('[data-theme-label]')
    if (text) text.textContent = current === 'dark' ? 'Mode clair' : 'Mode sombre'
  })
  document.addEventListener('click', e => {
    if (!e.target.closest('[data-theme-toggle]')) return
    current = current === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = current
    try { localStorage.setItem(KEY, current) } catch { /* navigation privée : le choix ne dure que la visite */ }
    sync()
  })
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', sync) : sync()
})()
