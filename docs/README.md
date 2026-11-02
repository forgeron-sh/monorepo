# Forgeron — documentation

Ce dossier imagine le SDK Forgeron à partir de cas concrets. Chaque exemple part d'une **contrainte métier**, en déduit ce que le SDK doit offrir, puis montre le tool complet tel qu'un développeur l'écrirait. `sdk.md` consolide ensuite toutes les décisions en une seule spécification.

> Statut : proposition de travail. Les noms d'API, de commandes et de fichiers sont à valider par l'équipe.

## Les fichiers

- [`white-paper.md`](white-paper.md) — la vision, le produit, les cibles, le modèle économique, la feuille de route.
- [`ARCHITECTURE.md`](ARCHITECTURE.md) — le plan du monorepo qui construit Forgeron : apps, paquets, modèles, modes d'hébergement, outillage, livraison.
- [`DECISIONS.md`](DECISIONS.md) — le journal des décisions, daté, avec ce qui a été écarté et pourquoi.
- [`design-system.md`](design-system.md) — la charte : couleurs, typographie, logo, composants. Les fichiers (tokens, polices, logos) sont dans `../assets/`.

| Fichier                                                                | Contrainte de départ                                                      | Ce que l'exemple fait émerger                                                                                                                                                                      |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`exemples/01-crm.md`](exemples/01-crm.md)                             | Un CRM léger : contacts, sociétés, pistes, utilisable depuis Claude       | Schéma de base, migrations (structure et données), actions, rôles et accès, historique, vue React, tests                                                                                           |
| [`exemples/02-passerelle-odoo.md`](exemples/02-passerelle-odoo.md)     | Interroger Odoo depuis Claude avec la clé d'API de chaque personne        | Tool sans base, secrets par personne, SSO Microsoft, appels sortants autorisés, cache, erreurs, interfaces partielles                                                                              |
| [`exemples/03-centre-de-donnees.md`](exemples/03-centre-de-donnees.md) | Un référentiel de données métier alimenté par imports et synchronisations | Fichiers (R2), import CSV, tâches planifiées, connecteur Microsoft 365, colonnes JSON, migration destructive en deux temps                                                                         |
| [`exemples/04-tableau-de-bord.md`](exemples/04-tableau-de-bord.md)     | Un tableau de bord commercial léger, au-dessus du CRM                     | Vues React, hooks de données, composition entre tools, accès par vue, paramètres d'URL                                                                                                             |
| [`sdk.md`](sdk.md)                                                     | —                                                                         | La spécification consolidée : structure, config et ressources, CLI, runtime, base et migrations, interfaces, tests, build, déploiement, versioning et changelog, MCP d'administration, paquets npm |

## Principes communs

1. **Une forme imposée.** Tous les tools ont la même arborescence. Le nom d'une action vient de son chemin de fichier.
2. **Une action, quatre interfaces.** MCP, API, CLI et Web sont générés depuis la même déclaration.
3. **Ne pas réinventer.** Kysely pour le SQL, Zod pour les schémas, Vitest pour les tests, React pour les vues, Cloudflare pour l'exécution. Forgeron construit la forme, les migrations, le build, les permissions et le déploiement.
4. **Sûr par défaut.** Aucune action sans niveau d'accès ; aucun secret dans le code ; aucun appel sortant non déclaré.
