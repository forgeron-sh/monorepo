# @forgeron/cli

The `forgeron` binary.

## Implemented

- `forgeron dev [dir] [--port n]`: builds the tool, runs it in workerd (local hosting) and serves `/mcp`, `/api/<action>` and `/cli`; rebuilds when a source changes, keeping the URL, and keeps serving the previous build if the new one fails.

## Planned contents

- Tool lifecycle: `init`, `link`, `dev`, `play`, `test`, `build`, `deploy`, `promote`, `rollback` (`sdk.md` §5)
- Versions: `change`, `change check`, `release`, `changelog` (`sdk.md` §16)
- Database, secrets, access: `db`, `secrets`, `token`, `access` (`sdk.md` §5)
- Self-hosted platform installation: `platform install` (proposal, `docs/ARCHITECTURE.md`)
- Tool actions as commands: `forgeron <tool> <group> <verb>`

## Notes

Node. Depends on `@forgeron/sdk`, `@forgeron/compiler` and `@forgeron/hosting`; nothing depends on it (D-003).
