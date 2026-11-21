# Blueprint parity status

Written by `animated.test.ts` (docs/blueprint/engine.md, P3): each routed scene of the site, how the engine plays it, and whether its animated frames equal the frozen ones of `golden.json` (`material`, `ink`, `tone`, `color`, exact; frozen in P4 from frames equal to the TypeScript reference). **data**: the scene's `.bp` (converted by hand, `scripts/blueprint/by-hand.ts`) with its timelines; **script**: the scene function on the script layer, its blocks rasterised by the engine. A scene enters the data column only when it passes.

28 scenes: 6 from data, 22 on the script layer; 28 equal over 2392 cases.

| Scene             | Plays from | Cases | Parity |
| ----------------- | ---------- | ----: | ------ |
| `erp-village`     | data       |   508 | equal  |
| `stack6`          | script     |   268 | equal  |
| `resources`       | script     |   268 | equal  |
| `production-line` | script     |   508 | equal  |
| `web`             | data       |    28 | equal  |
| `mcp`             | data       |    28 | equal  |
| `cli`             | data       |    28 | equal  |
| `api`             | script     |    28 | equal  |
| `badge-gate`      | script     |    28 | equal  |
| `dashboard`       | script     |    56 | equal  |
| `ledger`          | script     |    28 | equal  |
| `usage-iso`       | data       |    28 | equal  |
| `ai-gateway`      | script     |    28 | equal  |
| `safe`            | script     |    56 | equal  |
| `permissions-iso` | script     |    28 | equal  |
| `market`          | script     |    28 | equal  |
| `approval-plug`   | script     |    28 | equal  |
| `host-cloud`      | script     |    84 | equal  |
| `host-self`       | script     |    56 | equal  |
| `host-servers`    | data       |    56 | equal  |
| `isolated`        | script     |    28 | equal  |
| `bolt`            | script     |    28 | equal  |
| `drawer`          | script     |    28 | equal  |
| `fuel-month`      | script     |    28 | equal  |
| `fuel-topup`      | script     |    28 | equal  |
| `fuel-pool`       | script     |    28 | equal  |
| `forge-cta`       | script     |    28 | equal  |
| `machine`         | script     |    28 | equal  |
