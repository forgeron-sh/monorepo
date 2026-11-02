# Modèle `pilotage`

Tableau de bord commercial léger, au-dessus du CRM.

Spécification : [`docs/exemples/04-tableau-de-bord.md`](../../docs/exemples/04-tableau-de-bord.md). Ce dossier suit la forme imposée d'un tool (`docs/sdk.md` §2) ; `forgeron.config.ts` sera ajouté avec le SDK.

- Version : portée par `package.json`, modifiée uniquement par `forgeron release` (D-007).
- Sert de test d'intégration du SDK : il doit compiler, passer ses tests et se déployer en preview à chaque PR.
- N'utilise que l'API publique (`@forgeron/sdk`, `@forgeron/ui`, connecteurs).
