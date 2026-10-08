// Statistiques de visite (Umami auto-hébergé, sans cookie) + suivi des clics sortants.
(function () {
  if (location.hostname !== 'topo-host.com') return; // pas de stats en local

  var s = document.createElement('script');
  s.defer = true;
  s.src = 'https://stats.topo-host.com/t.js';
  s.dataset.websiteId = 'abb57e7d-eb39-4288-92f3-f2309d5111ca';
  document.head.appendChild(s);

  function eventFor(a) {
    var href = a.getAttribute('href') || '';
    if (/\.pdf$/i.test(href)) return 'CV PDF';
    if (href.indexOf('mailto:') === 0) return 'Contact e-mail';
    if (href.indexOf('tel:') === 0) return 'Contact téléphone';
    if (a.host && a.host !== location.host) return /github\.com$/.test(a.hostname) ? 'GitHub' : 'Démo / lien externe';
    return null;
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    var name = a && eventFor(a);
    if (name && window.umami) window.umami.track(name, { url: a.href });
  });
})();
