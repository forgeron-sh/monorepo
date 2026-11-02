<p align="center">
  <img src="assets/logos/2-logo-horizontal/forgeron-logo-sombre.svg" alt="forgeron" width="240" />
</p>

<p align="center">
  <strong>Forgez vos internal tools une fois, utilisez-les depuis Claude, l'API, le Web et le terminal.</strong>
</p>

<p align="center">
  <a href="docs/white-paper.md">White paper</a> ·
  <a href="docs/sdk.md">SDK</a> ·
  <a href="docs/ARCHITECTURE.md">Architecture</a> ·
  <a href="CONTRIBUTING.md">Contribuer</a> ·
  <a href="SECURITY.md">Sécurité</a>
</p>

---

## Forgeron

Forgeron est une plateforme open source pour écrire, versionner, héberger et gouverner les internal tools d'une entreprise. Un développeur décrit un tool une fois avec le SDK (ses données, ses actions, ses droits) et Forgeron l'expose en quatre interfaces : **MCP** pour Claude, **API**, **Web** et **CLI**. Tout tourne sur Cloudflare Workers.

Statut : conception. La spécification est dans [`docs/`](docs/README.md), le plan du dépôt dans [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Démarrer

```bash
proto use
bun install
bun run check
```

Le guide complet (prérequis, conventions de commit, contrôles, déploiement, versioning) est dans [CONTRIBUTING.md](CONTRIBUTING.md).

## Contribuer

Les contributions passent par des pull requests vers `main`. Lisez d'abord le [guide de contribution](CONTRIBUTING.md) et le [code de conduite](CODE_OF_CONDUCT.md).

Une faille de sécurité ? N'ouvrez pas d'issue publique : suivez la [politique de sécurité](SECURITY.md).

## Licence

À définir (voir les questions ouvertes du [white paper](docs/white-paper.md#questions-ouvertes)).
