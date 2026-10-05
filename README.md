# Portfolio

Site personnel de Tom Poyeau, en ligne sur https://topo-host.com.

Page statique (`public/index.html`), sans dépendance ni build, servie par Cloudflare Workers (assets statiques).
La démo simulée de PingWatch est une page autonome : `public/pingwatch/index.html`.

## Mettre à jour le site

```bash
npx wrangler deploy
```

La configuration (nom du Worker, domaine) est dans `wrangler.jsonc`.

## Les démos jouables

| Démo | Adresse | Code source compilé |
|---|---|---|
| Sites restaurant | https://resto.topo-host.com | `../laromate` |
| Hélio | https://helio.topo-host.com | `../helpdesk/vue-app` |
| Bloom | https://bloom.topo-host.com | `../bloom` |

Les démos sont compilées à partir des dépôts voisins, sans rien y écrire durablement. Firebase y est
remplacé par un faux Firestore en mémoire (`demos/kit/`) : aucune vraie base n'est contactée, les
données de départ viennent de `demos/<démo>/seed.js` et les changements du visiteur restent dans
son onglet. Le bouton « Réinitialiser » du bandeau remet la démo à zéro.

```bash
node demos/build.mjs resto     # ou helio, bloom
npx wrangler deploy --config demos/resto/wrangler.jsonc
```

Pour Bloom, le script ajoute temporairement la redirection vers le faux Firebase dans
`metro.config.js` et passe le web en mode « single » dans `app.json`, puis restaure les deux fichiers.
