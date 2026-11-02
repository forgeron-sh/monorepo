# @forgeron/runtime

Exécute un tool dans son Worker et sert ses quatre interfaces.

## Contenu prévu

- Routage `/mcp`, `/api/<action>`, `/cli`, vues (`sdk.md` §7)
- Contrôle de `access` et des rôles, jetons à audience
- Construction de `ctx` à partir de `env` (`sdk.md` §6)
- Événements et tâches planifiées (`sdk.md` §9)

## Notes

workerd uniquement : aucun `node:*`, aucun import du compilateur (règle `runtime-stays-on-workers`).
