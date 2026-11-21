# @forgeron/libraries

Shared assets of the monorepo, one folder per type, so that an app uses another app's assets without importing from it. It imports no other package of ours (rule `libraries-is-a-leaf` in `.dependency-cruiser.cjs`) and has no side effects: an app ships only the files it imports.

Internal package.

## `blueprints/`

The Blueprint scenes (`.bp`, [format](../../docs/blueprint/format.md)) the site draws: the converted library, the by-hand scenes (`erp-village.bp` is written by `scripts/blueprint/village.ts`) and, in `control/`, the control files of the scenes whose pixels stay on the script layer.

```ts
// Through @forgeron/blueprint/vite:
import village from "@forgeron/libraries/blueprints/erp-village.bp?compiled"; // what the site plays
import meta from "@forgeron/libraries/blueprints/erp-village.bp?meta"; // names, camera, no bytes
import file from "@forgeron/libraries/blueprints/erp-village.bp"; // the file as written

// Every top-level file, each loaded when asked for (no plugin needed):
import { library } from "@forgeron/libraries/blueprints";
```

## `boards/`

Demo documents of the canvas editors, written by `bun scripts/demo-boards.ts` (seeded: the same run gives the same files) and checked by `scripts/demo-boards.test.ts`:

- `q1-workshop.draw.json`: a `forgeron/draw` board, version 1, the "Q1 product workshop" a team of eight leaves after a day (about 2,600 items: frames, notes in affinity clusters, dot votes, pen circles, a journey map and an architecture sketch with bound arrows, a retro, a roadmap, screenshots as PNG data URLs).
- `order-to-cash.flow.json`: a flow, version 1, the "Order-to-cash automation" on Odoo and Microsoft 365 (334 nodes in 15 groups, typed ports, laid out by `layoutGraph`); each node's `data.run` says what it did in the demo run, for `planRun`.

```ts
const json = (await import("@forgeron/libraries/boards/q1-workshop.draw.json?raw")).default;
```

A new asset type (`images/`, fonts…) is a new folder and an `exports` entry, not a new package.
