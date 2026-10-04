# Portfolio

Site personnel de Tom Poyeau, en ligne sur https://topo-host.com.

Page statique unique (`public/index.html`), sans dépendance ni build, servie par Cloudflare Workers (assets statiques).

## Mettre à jour le site

```bash
npx wrangler deploy
```

La configuration (nom du Worker, domaine) est dans `wrangler.jsonc`.
