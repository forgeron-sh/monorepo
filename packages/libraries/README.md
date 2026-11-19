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

A new asset type (`images/`, fonts…) is a new folder and an `exports` entry, not a new package.
