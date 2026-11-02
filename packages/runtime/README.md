# @forgeron/runtime

Runs a tool in its Worker and serves its four interfaces.

## Planned contents

- Routing `/mcp`, `/api/<action>`, `/cli`, views (`sdk.md` §7)
- Enforcement of `access` and roles, audience-bound tokens
- Building `ctx` from `env` (`sdk.md` §6)
- Events and scheduled jobs (`sdk.md` §9)

## Notes

workerd only: no `node:*`, no compiler import (`runtime-stays-on-workers` rule).
