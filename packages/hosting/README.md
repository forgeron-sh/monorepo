# @forgeron/hosting

Déploie un tool et ses ressources, quel que soit le mode d'hébergement (D-009).

## Contenu prévu

- Interface : `provision`, `upload`, `migrate`, `activate`, `teardown`
- Mode `cloud` : Workers for Platforms, compte Forgeron
- Mode `self-host` : Workers classiques par l'API Cloudflare, compte du client
- Mode `local` : `forgeron dev`

## Notes

Neutre : appels HTTP à l'API Cloudflare par `fetch`, utilisable depuis la gateway et depuis le CLI. Voir `docs/ARCHITECTURE.md`, « Modes d'hébergement ».
