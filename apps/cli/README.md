# @forgeron/cli

Le binaire `forgeron`.

## Contenu prévu

- Cycle de vie d'un tool : `init`, `link`, `dev`, `play`, `test`, `build`, `deploy`, `promote`, `rollback` (`sdk.md` §5)
- Versions : `change`, `change check`, `release`, `changelog` (`sdk.md` §16)
- Base, secrets, accès : `db`, `secrets`, `token`, `access` (`sdk.md` §5)
- Installation de la plateforme en self-host : `platform install` (proposition, `docs/ARCHITECTURE.md`)
- Les actions des tools en commandes : `forgeron <tool> <groupe> <verbe>`

## Notes

Node. Dépend de `@forgeron/sdk`, `@forgeron/compiler` et `@forgeron/hosting` ; rien ne dépend de lui (D-003).
