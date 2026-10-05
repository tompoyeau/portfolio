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
| ERP SII (Picsou) | https://erp.topo-host.com | `../erp-sii/front` (réponses de l'API enregistrées) |
| La Truffe Gourmande | https://truffe.topo-host.com | `../truffe-gourmande` (copie des pages, sans build) |

Les démos sont compilées à partir des dépôts voisins, sans rien y écrire durablement. Firebase y est
remplacé par un faux Firestore en mémoire (`demos/kit/`) : aucune vraie base n'est contactée, les
données de départ viennent de `demos/<démo>/seed.js` et les changements du visiteur restent dans
son onglet. Le bouton « Réinitialiser » du bandeau remet la démo à zéro.

```bash
node demos/build.mjs resto     # ou helio, bloom, truffe, erp
npx wrangler deploy --config demos/resto/wrangler.jsonc
```

Pour Bloom, le script ajoute temporairement la redirection vers le faux Firebase dans
`metro.config.js` et passe le web en mode « single » dans `app.json`, puis restaure les deux fichiers.

## ERP SII : une démo sans serveur

L'ERP a une vraie API (Express + PostgreSQL). Pour la démo, on enregistre une fois ses réponses sur des
données fictives, puis l'interface les rejoue dans le navigateur :

1. lancer la base et l'API en local (voir `D:\dev\erp-sii\LISEZMOI.md`) ;
2. `node demos/erp/record.mjs` → `demos/erp/snapshot.json` ;
3. `node demos/build.mjs erp` puis `npx wrangler deploy --config demos/erp/wrangler.jsonc`.

`demos/erp/setup.js` remplace le serveur (adaptateur axios), connecte le visiteur d'office et fige
l'horloge à la date de l'enregistrement, pour que l'exercice en cours et les statistiques restent
cohérents. Les écritures sont acceptées mais pas enregistrées.
