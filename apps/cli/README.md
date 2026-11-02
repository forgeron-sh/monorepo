# @forgeron/cli

The `forgeron` binary.

## Planned contents

- Tool lifecycle: `init`, `link`, `dev`, `play`, `test`, `build`, `deploy`, `promote`, `rollback` (`sdk.md` §5)
- Versions: `change`, `change check`, `release`, `changelog` (`sdk.md` §16)
- Database, secrets, access: `db`, `secrets`, `token`, `access` (`sdk.md` §5)
- Self-hosted platform installation: `platform install` (proposal, `docs/ARCHITECTURE.md`)
- Tool actions as commands: `forgeron <tool> <group> <verb>`

## Notes

Node. Depends on `@forgeron/sdk`, `@forgeron/compiler` and `@forgeron/hosting`; nothing depends on it (D-003).
