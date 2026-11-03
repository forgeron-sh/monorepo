# @forgeron/cli

The `forgeron` binary.

## Implemented

| Command                                                | What it does                                                                                                                                                                                                        |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `forgeron init [name]`                                 | Creates a tool of one action with its test, `changes/` and `.forgeron/` (`project.json` holds the tool name). Refuses a folder that is not empty. `--template` is for the catalog, not available yet.               |
| `forgeron secrets set <NAME> [--env]` / `list [--env]` | Sets a tool secret of an environment (`production` by default): the value is typed or piped, never an argument. `list` prints names only. Needs `FORGERON_TOKEN` (an admin token) and a linked tool.                |
| `forgeron link --workspace <name> [--endpoint <url>]`  | Writes the workspace and its address to `.forgeron/project.json`. Nothing is sent.                                                                                                                                  |
| `forgeron build`                                       | Builds every tool under the current folder into `.forgeron/build/` (`worker.js`, `manifest.json`, `build.json`).                                                                                                    |
| `forgeron db generate [--name <name>]`                 | Writes the migration for a change of `db/schema.ts` (and its snapshot). Says when it drops data or cannot be undone, and refuses a change it cannot write safely.                                                   |
| `forgeron test [vitest args]`                          | Builds, then runs Vitest (`vitest run` without arguments): `createTestTool` runs the built Worker.                                                                                                                  |
| `forgeron dev [--as <role>] [--port 8787]`             | Runs the tool in workerd (local hosting): `/mcp`, `/api/<action>`, `/cli`. Rebuilds on change, keeping the URL; keeps serving the previous build if the new one fails. `--as` runs as a person with only that role. |

Exit codes (`sdk.md` §5): `0` success, `1` failure, `2` wrong use.

## Planned contents

- Tool lifecycle: `play`, `deploy`, `promote`, `rollback` (`sdk.md` §5)
- Versions: `change`, `change check`, `release`, `changelog` (`sdk.md` §16)
- Database, secrets, access: `db`, `secrets`, `token`, `access` (`sdk.md` §5)
- Self-hosted platform installation: `platform install` (proposal, `docs/ARCHITECTURE.md`)
- Tool actions as commands: `forgeron <tool> <group> <verb>`

## Notes

Node. Depends on `@forgeron/sdk`, `@forgeron/compiler` and `@forgeron/hosting`; nothing depends on it (D-003).
