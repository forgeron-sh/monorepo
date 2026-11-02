# Modèle `odoo-gateway`

Interroger Odoo depuis Claude avec la clé d'API de chaque personne.

Spécification : [`docs/exemples/02-passerelle-odoo.md`](../../docs/exemples/02-passerelle-odoo.md). Ce dossier suit la forme imposée d'un tool (`docs/sdk.md` §2) ; `forgeron.config.ts` sera ajouté avec le SDK.

- Version : portée par `package.json`, modifiée uniquement par `forgeron release` (D-007).
- Sert de test d'intégration du SDK : il doit compiler, passer ses tests et se déployer en preview à chaque PR.
- N'utilise que l'API publique (`@forgeron/sdk`, `@forgeron/ui`, connecteurs).
