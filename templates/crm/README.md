# Modèle `crm`

Sociétés, contacts et pistes, utilisable depuis Claude.

Spécification : [`docs/exemples/01-crm.md`](../../docs/exemples/01-crm.md). Ce dossier suit la forme imposée d'un tool (`docs/sdk.md` §2) ; `forgeron.config.ts` sera ajouté avec le SDK.

- Version : portée par `package.json`, modifiée uniquement par `forgeron release` (D-007).
- Sert de test d'intégration du SDK : il doit compiler, passer ses tests et se déployer en preview à chaque PR.
- N'utilise que l'API publique (`@forgeron/sdk`, `@forgeron/ui`, connecteurs).
