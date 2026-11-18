# Blueprint file format, version 1

> Normative. Design and rationale: [`engine.md`](engine.md) §2. Types: `packages/blueprint/src/format/types.ts`; schema: `packages/blueprint/schema/blueprint.v1.json` (written from `src/format/schema.ts` by `scripts/blueprint/gen-schema.ts`), to be served at `https://blueprint.forgeron.sh/schema/v1.json`. Reference implementation: `@forgeron/blueprint/format` (`readBlueprint`, `flatten`, `writeBlueprint`).

A Blueprint file is one JSON document, named `*.bp.json`, holding a library of **Parts** (primitives), **Assemblies** (placed instances of parts and assemblies) and **Scenes** (an assembly with a camera, inputs and motion). Where this text and the schema disagree, the schema states the shape and this text states the meaning.

## 1. File

| Key          | Required | Meaning                                                                |
| ------------ | -------- | ---------------------------------------------------------------------- |
| `$schema`    | yes      | exactly `"https://blueprint.forgeron.sh/schema/v1.json"`               |
| `version`    | yes      | the integer `1`                                                        |
| `id`         | yes      | a stable id of the file, non-empty (`"site/objects"`)                  |
| `imports`    | no       | other files whose parts and assemblies this file uses (§3)             |
| `palette`    | no       | slots (`bg` and the six inks) → a colour string or `{ var, fallback }` |
| `parts`      | no       | name → Part (§4)                                                       |
| `assemblies` | no       | name → Assembly (§5)                                                   |
| `scenes`     | no       | name → Scene (§6)                                                      |

**Unknown keys are errors**, everywhere. **Versions**: a reader accepts its own version and older ones it can migrate; a file whose `version` is newer than the reader's is rejected with a message that names that version.

**Names** of parts, assemblies, scenes, params, sockets and instance ids match `^[A-Za-z0-9_][A-Za-z0-9_-]*$`: no `:` (the import separator), no `.` or `/` (paths). Parts and assemblies share one namespace in a file; scenes have their own.

**Errors** name the faulty value by its JSON Pointer, prefixed by the file's location: `office.bp.json: /parts/rack/prims/0/size: expected at least 3 items, got 2`.

## 2. Values

- **Numbers** are float64 world units (one unit is `u` raster pixels at the current zoom; `dash` and dot `size` are raster pixels). A writer emits the shortest form that reads back to the same float64, so a file round-trips bit for bit. A negative zero is read as 0.
- **`Num`**: a number; a parameter reference `"@name"`; or `{ "p": "name", "k": k, "b": b }`, meaning `b + k · name` (`k` 1 and `b` 0 by default), evaluated in that order in float64.
- **`NumVec`**: three `Num`s, `[x, y, z]`; `+z` is up.
- **`Flag`**: `true`, `false`, `"@name"` (true when the parameter is truthy) or `{ "not": "@name" }`.
- **`InkRef`**: one of `ink`, `dim`, `faint`, `accent`, `signal`, `alert`, or `{ "if": Flag, "then": Ink, "else": Ink }`.
- **Equality.** Two pictures are equal when their blocks are equal as values. A `false` flag means the same as an absent one; evaluators omit it.

## 3. Imports

`{ "from": path, "as": prefix, "use"?: names }`.

- `from` starting with `./` or `../` is resolved against the importing file's location; anything else is a package path, passed as written to the host's loader.
- Every part and assembly of the imported file becomes visible as `prefix:name`. Names the imported file itself imports keep their own prefix behind the new one: `office:hw:screw`.
- With `use`, only the listed names become visible to the importing file (each must be defined in the imported file, or it is an error naming `/imports/i/use/k`). The other definitions still exist, under the prefix, for the listed ones to use.
- Two imports of one file may not share a prefix (an error naming `/imports/i/as`).
- An import cycle is an error that lists the chain (`a.bp.json → b.bp.json → a.bp.json`).
- Every `use` in a file (instances, `conveyor` tracks) names a part or assembly visible from that file, or the file is rejected.
- Only parts and assemblies are imported; scenes are not.

## 4. Parts

`{ "title"?, "params"?, "prims": Prim[], "sockets"? }`.

- **`params`**: name → `{ "type": "number" | "int" | "flag", "default": value }`. The defaults make the part's still picture; instances and tracks set them.
- **`sockets`**: name → `{ "at": NumVec, "facing"?: "+x" | "-x" | "+y" | "-y" | "+z" | "-z" }`, points in the part's frame used for snapping (§5) and by tracks.

### Prims

Every prim may carry `layer` (number, painter mode: lower layers are drawn first), `decor` (scenery: drawn, never used to frame the scene), `visible` (`Flag`: a false prim is not drawn) and `tag` (a hover and legend name, for the engine's id buffer).

| Kind     | Keys                                                               | Meaning                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| -------- | ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `box`    | `at`, `size`, `anchor`, `tone`, `look`, `plate`, `floors`, `vents` | An axis-aligned box. `anchor: "corner"` (default): `at` is the minimum corner. `anchor: "base-centre"`: `at` is the centre of the bottom face, and the corner is `[x − w/2, y − d/2, z]`. `tone`: densities 0–1 of the top face, the faces looking along ±y (`left`) and ±x (`right`). `look`: `plain` (default), `accent`, `signal`, `alert` or `ghost` (dashed outline only), or a choice on a flag. `plate`: inset outline, studs and a ring on top. `floors`: a line on the side faces every `floors` units. `vents`: vertical vents on one side face of the part's frame (`+x` is the right face of the default view). |
| `line`   | `points` (2 or more `NumVec`), `ink`, `dash`                       | A polyline: one segment per consecutive pair, in order. `dash`: dash and gap length in pixels; 0 or absent is solid.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `dot`    | `at`, `ink`, `size`                                                | A square of `size` pixels (2 by default) centred on `at`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `label`  | `at`, `text`, `to`, `active`, `plain`, `fixed`, `ink`              | A screen-aligned tag in the bitmap face, with a leader down to `to`. `plain`: text only. `fixed`: kept above its anchor, even over the drawing. `active`: highlighted.                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `rig`    | `rig`, `with`                                                      | A parametric generator of the engine: `wheel`, `arm`, `fan`, `piston`, `pendulum`, `smoke`, `sparks` ([`engine.md`](engine.md) §2, "Rigs"). `with` holds its settings and channels: `Num`, `NumVec`, `Flag`, `InkRef`, or a name string (`"plane": "yz"`, never starting with `@`). Evaluated by the engine from P3.                                                                                                                                                                                                                                                                                                        |
| `sprite` | `at`, `sprite`                                                     | Reserved for v1.1 (a screen-aligned bitmap). Accepted by the schema; no evaluator draws it yet.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |

## 5. Assemblies and instances

An assembly is `{ "title"?, "params"?, "instances": Instance[], "sockets"? }`; its `sockets` expose inner ones: `"door": "body.front"` (instance id, a dot, socket name).

An instance places a part or an assembly:

| Key       | Meaning                                                                                                                                                                  |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `use`     | a part or assembly name, local or imported (`office:server`)                                                                                                             |
| `id`      | unique among the instances of its assembly; the target of `snap.to`, tracks and states                                                                                   |
| `at`      | translation, in the parent's frame (`[0, 0, 0]` when absent)                                                                                                             |
| `turn`    | quarter turns about `+z`, counter-clockwise seen from above: `0`–`3`                                                                                                     |
| `scale`   | uniform scale, `> 0` (1 by default)                                                                                                                                      |
| `snap`    | `{ "socket": mine, "to": "otherId.socket" }`: after scale and turn, translate so that my socket lands on the other instance's socket (added to `at` when both are given) |
| `params`  | values for the used definition's params: literals, or the enclosing assembly's params (`"@on"`); a name the definition does not declare is an error                      |
| `layer`   | added to the layer of every prim inside                                                                                                                                  |
| `visible` | `Flag`, evaluated in the parent's scope: false hides the whole instance                                                                                                  |
| `tag`     | hover and legend name                                                                                                                                                    |

**Placement.** A point `p` of the used definition lands at `at + R(turn)(scale · p)` in the parent's frame, where `R(1)(x, y, z) = (−y, x, z)`. Nested instances compose. A box stays axis-aligned: its corner and size are turned as a box (`turn 1`: corner `[−(y + d), x, z]`, size `[d, w, h]`). Under an odd turn a box's `left` and `right` tones swap (its x-facing faces now face y). `vents` turn with their face; vents that land on a hidden face (`−x`, `−y`) are not drawn; vents that land on `+y` are an error until the engine draws them (P2). `floors` scales with the instance; `dash` and dot `size` do not (pixels).

**Exactness.** A placement with no `at`, `turn` 0 and `scale` 1 does no arithmetic: the prims keep their exact values.

**Scope.** Inside a definition, `"@name"` refers to its own params, whose values are the defaults overridden by the instance's `params`. A scene's root assembly sees the scene's vars and its own params (§6).

**Order.** A definition's picture is its prims in order, or its instances in order, depth first. In painter mode, blocks are then sorted by layer and by the painter's key, stably, as today's renderer does.

## 6. Scenes

`{ "title", "description"?, "root": Assembly, "camera", "depth", "palette"?, "filters"?, "post"?, "labels"?, "vars"?, "timelines"?, "machines"? }`.

- **`camera`**: `view` (a quarter turn of the whole world before projection), `fit` (`fill` in `(0, 1]`, `unit` `even` or `any`, an explicit world `box`, and `at`: the time and var values at which the framing is computed), `zooms`, named `shots`.
- **`depth`**: `painter` (today's order, exactly) or `zbuffer` (a depth buffer; [`engine.md`](engine.md) §3).
- **`filters`**: `pixel` (integer ≥ 1), `dither` (`2`, `4`, `8` or `"none"`), `glow`. `post`: `@forgeron/shaders` preset ids, outside parity.
- **`vars`**: `time` (implicit as `t`, seconds), `progress` (0–1, written by the host), `int` (`default`, optional `cycle: { every, count }`), `pointer` (the hovered tag).
- **`timelines`** and **`machines`**: their shapes are fixed by the schema and their meaning by [`engine.md`](engine.md) §2; they are evaluated by the engine from P3.

### The still picture (`flatten`)

The still picture of a scene at given var values is: `t = 0`, every var at its default (`progress` 0 when it has none), the root's params at their defaults, then the given values by name; then the root assembly evaluated as in §5, after the camera's `view` turn about the origin. No timeline or machine runs. A `rig` or `sprite` prim, or a snap to a rig socket, is an error in this evaluation.

## 7. Converted files

`scripts/blueprint/convert-site.ts` writes one file per site scene (`apps/site/src/illustrations/library/<scene>.bp.json`, id `site/<scene>`): a part `static` with the blocks every sample of the scene function draws, in the order the first sample draws them, and a scene of the same name in painter mode with one instance of it. Its `vars` declare `active` and `progress` when the picture depends on them. What varies is listed in `target/blueprint/convert-report.md`.
