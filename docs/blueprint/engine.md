# Blueprint engine: the scene system, its format and its Rust core

> Status: P1 to P6 built (19 November 2026): the site plays its scenes on the engine, the gallery views any scene on canvas (P5 notes), and `apps/blueprint` is built for `blueprint.forgeron.sh`, not yet deployed (P6 notes). Designed 18 November 2026. Builds on D-148 and on the benchmark in [`../benchmarks/canvas-engine.md`](../benchmarks/canvas-engine.md). The owner's decisions it applies are in the handoff ([`../handoff/2026-11-18-ui-canvas-blueprint.md`](../handoff/2026-11-18-ui-canvas-blueprint.md), "Performance", "Blueprint rebuild"). To be recorded as D-150 when phase 1 lands.

Blueprint becomes a small, specialised scene engine: Parts and Assemblies described as JSON, Scenes with an iso camera, Timelines and state machines, compiled and rasterised by a Rust core in WebAssembly, presented by a thin TypeScript layer. The same core runs at build time for the static SVG and PNG. Nothing switches on the site before every scene renders identically from the new engine.

**Fixed by the owner** (not reopened here): isometric pixel style, orthographic, four quarter-turn views, no free 3D camera; a TypeScript WebGL2 presenter fed by buffers in WASM shared memory; no wgpu; one boundary call per frame; a WASM budget of 150–300 KB; the canvas editor engine stays TypeScript for now.

## 1. What exists today

### Code

| Where                                   | Lines | What it is                                                                                                                                              |
| --------------------------------------- | ----: | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/blueprint/src/core/`          | 1,550 | blocks, iso 2:1 projection and fit, rasteriser into a frame of materials, filters, palette, SVG, the bitmap face (`@forgeron/font`), field GLSL as data |
| `packages/blueprint/src/dom/`, `react/` |   640 | `mount` (observers, loop, cycle, reduced motion), `mountField` (WebGL fields), `mountImage`, `<Blueprint>` with marker components                       |
| `apps/site/src/illustrations/` iso      | 5,555 | `objects.ts` 2,142 · `village.ts` 1,666 · `scenes.ts` 1,165 · `machine.ts` 347 · `parts.ts` 235                                                         |
| `apps/site/src/illustrations/` cells    |   880 | `flat.ts` 583 (the /wild-erp scene) · `hearth.ts` 297 (the footer)                                                                                      |
| `apps/site/src/illustrations/canvas.ts` |   155 | `canvas[data-iso]` options parsed from `data-*`, the `isoCanvas(el)` handle (`select`, `show`, `onActive`)                                              |

### The model

- **Four primitives** (`core/types.ts`): `box` (at, size, face tones, `accent`/`signal`/`alert`, `ghost`, `plate`, `floors`, `vents`), `line` (ink, dash), `dot` (ink, size), `label` (bitmap-face tag with a leader, `plain`, `fixed`, `active`). Six inks: ink, dim, faint, accent, signal, alert.
- **Projection**: `P(x, y, z) = [ox + (x − y)·u, oy + (x + y)·u/2 − z·u]`, one view only (looking at the corner max x, max y). `fit` picks an even unit `u ≥ 2` once per size, so whole units land on whole pixels and the framing never jitters.
- **Rasteriser** (`core/draw.ts`): a low-resolution frame per pixel: material (face top/left/right, edge, detail, dot, label parts), colour slot, tone. Boxes write faces, then details, then edges. Labels are placed last, around what is drawn. Dither (Bayer 4×4) then reads face pixels only.
- **Depth is faked.** Blocks are sorted by `layer`, then by a painter's key (`x + w + y + d + z/2` for a box; floor lines go under everything). Where that fails, the author lifts things by hand: `raise(out, from)` puts the lines and dots just pushed (LEDs, slots, screens on a face) one layer up; `lift(out, from, layer)` does it for boxes sitting on a face. `objects.ts` calls them 25 times and sets `layer:` 59 times; `village.ts` 22 times.
- **Animation is a function of `t`.** Every scene is `(t, active) → Block[]`, rebuilt from scratch each frame: wheels and gears turn by `angle = t·rate`, arms solve two-link IK, packets ride trays (`(t·speed + k·L/n) % L`), lights blink on `floor(t·2 + seed) % 7 < 2`, smoke and sparks come from hashes of `t`. Two inputs come from outside: `active` (an index) and a scroll progress kept in module stores (`villageStore.progress`, `lineStore.progress`).
- **Two scenes keep state between frames**: `stack6` eases each plate towards its spread with `k = min(1, dt·9)` (a frame-rate-dependent spring, module-level `spreadNow`), and `village.ts` sets `deserted` from the progress before drawing people.

### Measured cost (TypeScript, today)

Bun on an Apple M4, **machine loaded** (load average 47 on 10 cores): read the ratios, not the absolutes.

| Scene, target                              | Blocks | Scene function | Whole frame (scene + raster + dither) |
| ------------------------------------------ | -----: | -------------: | ------------------------------------: |
| `erp-village`, 1440 × 900 at 2 px, p = 0.1 |  1,458 |        0.76 ms |                               5.98 ms |
| `erp-village`, same, p = 0.75 (explosion)  |        |        4.37 ms |                          **16.46 ms** |
| `machine`, 1440 × 900 at 2 px              |  1,941 |        1.01 ms |                               9.47 ms |
| `hero-line`, 1440 × 900 at 2 px            |    473 |        0.29 ms |                               9.29 ms |
| a card scene, 720 × 480 at 2 px (typical)  | 20–500 |                |                            0.7–3.2 ms |

The village's explosion already spends a whole 60 Hz frame on one canvas, before the page's own work. The home page mounts about 25 iso canvases; only the visible ones draw.

### Parity target: every scene the site renders

Routed pages (`apps/site/src/pages/`) plus the footer. Sizes are CSS sizes chosen by the page; all iso canvases on routed pages use `data-scale="2"`.

| Scene                                                                           | Page                                   | Features to keep                                                                                                                                                                                                                           |
| ------------------------------------------------------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `erp-village`                                                                   | `/` opening                            | 1,458 blocks; scroll progress drives 14 story steps (`STEPS`); camera = CSS transform on the canvas, per-step `FOCUS` (point + zoom 1–1.9) eased by a CSS transition; fixed framing box `FRAME`; `signal` mapped to `--success`; 14 labels |
| `stack6`                                                                        | `/` anatomy                            | hover on legend rows, and pointer height over the canvas, select a layer; the stack opens with a spring; one label                                                                                                                         |
| `resources`                                                                     | `/` resources                          | `active` cycles every 2 s over 9; hovering a legend row selects, leaving hands back to the cycle; `onActive` keeps the legend in step                                                                                                      |
| `production-line`                                                               | `/` develop                            | scroll progress of a pinned track moves the package; three stops lit by the page; 3 labels                                                                                                                                                 |
| `web`, `mcp`, `cli`, `api`                                                      | `/` ship doors                         | loops in `t`, `fill 0.6`                                                                                                                                                                                                                   |
| `badge-gate`, `dashboard`, `ledger`                                             | `/` access cards; `dashboard` /pricing | loops in `t`                                                                                                                                                                                                                               |
| `usage-iso`, `ai-gateway`, `safe`, `permissions-iso`, `market`, `approval-plug` | `/` bento; `safe` /pricing             | loops in `t`; `usage-iso` and `permissions-iso` are 280–380 boxes                                                                                                                                                                          |
| `host-cloud`, `host-self`, `host-servers`                                       | `/` and /pricing plans                 | loops in `t`                                                                                                                                                                                                                               |
| `isolated`, `bolt`, `drawer`                                                    | /pricing                               | loops in `t`                                                                                                                                                                                                                               |
| `fuel-month`, `fuel-topup`, `fuel-pool`                                         | /pricing usage                         | loops in `t`                                                                                                                                                                                                                               |
| `forge-cta`                                                                     | `/` closing                            | loops in `t`                                                                                                                                                                                                                               |
| `machine`                                                                       | /machine                               | 1,941 blocks, full screen, `unit any`, labels off; periods never quite repeat                                                                                                                                                              |
| `erp` (flat)                                                                    | /wild-erp                              | cell renderer, 4 px cells, 12 fps, 4 tones by Bayer; own 3×5 font; still frame at 9.2 s                                                                                                                                                    |
| hearth (flat)                                                                   | footer, every page                     | cell renderer, 4 or 2 px cells, ~20 fps, 5 tones by Bayer 8×8, pointer heats cells, the bitmap face as the wordmark                                                                                                                        |

Also in `SCENES` but only used by the unrouted `src/explorations/` pages: `cube`, `stack`, `blocks`, `network`, `pipeline`, `pipeline-labels`, `bars`, `gate`, `module`, `hero-cell`, `hero-line`, `hero-pipeline`, `hero-forge`, `hero-gateway` (see question 4). The WebGL fields (`ember`, `globe`, `dissolve`, `field`) and dithered images are generators, not scenes: they move to `@forgeron/shaders`, outside this engine.

Shared behaviour to keep: `pixelate(n)` → `dither({ matrix: 4 })` → `palette` (tokens read from CSS, `data-accent="off"`, `data-signal`, `data-bg`); `fill`, `unit`; labels on or off; drawing only while on screen; one frame at `t = 0` under reduced motion (scroll-driven scenes still follow the scroll); a resize refits and redraws at once.

## 2. The format

One JSON file holds a library of Parts, Assemblies and Scenes. Files end in `.bp`. The schema is published at `packages/blueprint/schema/blueprint.v1.json` (generated from the TypeScript types below) and served by `blueprint.forgeron.sh/schema/v1.json`.

**Principles**

- Data only. No expression language (rejected in `packages/blueprint/docs/design.md`, and still right): a number is a literal, a reference to a parameter, or a linear binding of one. Motion that data cannot say is a **rig** (a named, parametric generator built into the engine) or, as a last resort, a **script layer** (a TypeScript function writing blocks each frame, §3).
- Numbers are world units (one unit = `u` raster pixels at the current zoom). JSON round-trips a float64 exactly, which the parity tests rely on.
- Names are local to a file; an import gives another file's names a prefix (`office:server`).
- `version` is an integer. A reader accepts its own version and older ones it can migrate; a newer file is an error that names the version.

### TypeScript types (`packages/blueprint/src/format/types.ts`)

```ts
export type Vec3 = readonly [x: number, y: number, z: number];
export type Turn = 0 | 1 | 2 | 3; // quarter turns about +z, counter-clockwise seen from above
export type Ink = "ink" | "dim" | "faint" | "accent" | "signal" | "alert";

/** A number, a parameter (`"@lift"`), or `b + k·param`. */
export type Num = number | `@${string}` | { p: string; k?: number; b?: number };
export type NumVec = readonly [Num, Num, Num];
/** A boolean or a parameter; `{ not: "@on" }` inverts. */
export type Flag = boolean | `@${string}` | { not: `@${string}` };
/** An ink, or a choice on a flag. */
export type InkRef = Ink | { if: Flag; then: Ink; else: Ink };

export interface BlueprintFile {
  $schema: "https://blueprint.forgeron.sh/schema/v1.json";
  version: 1;
  /** Stable id of the file: "site/objects". */
  id: string;
  imports?: Import[];
  palette?: Palette;
  parts?: Record<string, Part>;
  assemblies?: Record<string, Assembly>;
  scenes?: Record<string, Scene>;
}

export interface Import {
  /** A path relative to this file, or a package path ("@forgeron/libraries/blueprints/office.bp"). */
  from: string;
  /** Names to take; all when absent. */
  use?: string[];
  /** Prefix of the imported names: `as: "office"` gives "office:server". */
  as: string;
}

/** Palette slots → colour references, as the filters' `palette` today. */
export type Palette = Partial<Record<"bg" | Ink, string | { var: string; fallback: string }>>;

// ── Part ─────────────────────────────────────────────────────────────────────

export interface Part {
  title?: string;
  /** Inputs of the part, animatable by tracks: their defaults make the part's still picture. */
  params?: Record<string, { type: "number" | "flag" | "int"; default: number | boolean }>;
  prims: Prim[];
  /** Named anchor points, for snapping and for tracks that follow a point. */
  sockets?: Record<string, { at: NumVec; facing?: "+x" | "-x" | "+y" | "-y" | "+z" | "-z" }>;
}

interface PrimBase {
  /** Painter mode only: lower layers first (kept from today's `layer`). */
  layer?: number;
  /** Scenery: drawn, never used to frame (today's `decor`). */
  decor?: boolean;
  visible?: Flag;
  /** Hover and legend tag: written into the id buffer (§3). */
  tag?: string;
}

export interface BoxPrim extends PrimBase {
  kind: "box";
  at: NumVec;
  size: NumVec;
  /** `corner` (default, today's `box`) or `base-centre` (today's `block`). */
  anchor?: "corner" | "base-centre";
  tone?: readonly [top: Num, left: Num, right: Num];
  /** Material of the box: today's flags, one at a time. */
  look?:
    | "plain"
    | "accent"
    | "signal"
    | "alert"
    | "ghost"
    | { if: Flag; then: BoxLook; else: BoxLook };
  plate?: boolean;
  floors?: Num;
  /** Vents on a face of the part's own frame; "+x" is today's right face. */
  vents?: "+x" | "+y" | "-x" | "-y";
}
type BoxLook = "plain" | "accent" | "signal" | "alert" | "ghost";

export interface LinePrim extends PrimBase {
  kind: "line";
  /** Two points, or more for a polyline. */
  points: readonly NumVec[];
  ink?: InkRef;
  dash?: number;
}

export interface DotPrim extends PrimBase {
  kind: "dot";
  at: NumVec;
  ink?: InkRef;
  size?: number;
}

export interface LabelPrim extends PrimBase {
  kind: "label";
  at: NumVec;
  text: string;
  to?: NumVec;
  active?: Flag;
  plain?: boolean;
  fixed?: boolean;
  ink?: InkRef;
}

/** A parametric generator built into the engine (the functions of today's `parts.ts`). */
export interface RigPrim extends PrimBase {
  kind: "rig";
  rig: "wheel" | "arm" | "fan" | "piston" | "pendulum" | "smoke" | "sparks";
  /** The rig's own settings and channels: see the rig table. */
  with: Record<string, Num | NumVec | Flag | InkRef>;
}

/** Reserved for v1.1: a screen-aligned pixel bitmap from the file's sprite table (icons, glyph runs). */
export interface SpritePrim extends PrimBase {
  kind: "sprite";
  at: NumVec;
  sprite: string;
}

export type Prim = BoxPrim | LinePrim | DotPrim | LabelPrim | RigPrim | SpritePrim;

// ── Assembly ─────────────────────────────────────────────────────────────────

export interface Assembly {
  title?: string;
  params?: Part["params"];
  instances: Instance[];
  /** Sockets of inner instances exposed as this assembly's own: "door": "body.front". */
  sockets?: Record<string, string>;
}

export interface Instance {
  /** Target of tracks, states and tags: unique inside its assembly; paths join with "/". */
  id?: string;
  /** A part or assembly name, local or imported ("office:server"). */
  use: string;
  at?: NumVec;
  turn?: Turn;
  /** Uniform scale (today's `s` argument of the objects). */
  scale?: number;
  /** Place by socket instead of `at`: my socket onto "otherInstance.socket". */
  snap?: { socket: string; to: string };
  /** Values for the used part's params: literals, or this assembly's params ("@on"). */
  params?: Record<string, Num | Flag>;
  /** Added to every prim's layer (painter mode). */
  layer?: number;
  tag?: string;
  visible?: Flag;
}

// ── Scene ────────────────────────────────────────────────────────────────────

export interface Scene {
  title: string;
  /** Read by assistive technology: the DOM overlay renders it (§3). */
  description?: string;
  root: Assembly;
  camera: Camera;
  /** "painter" reproduces today's order exactly; "zbuffer" uses a real depth buffer (§3). */
  depth: "painter" | "zbuffer";
  palette?: Palette;
  /** The material-aware stage, run by the engine on the raster (today's filters). */
  filters?: {
    pixel?: number;
    dither?: 2 | 4 | 8 | "none";
    glow?: { radius: number; density: number };
  };
  /** Post passes on the presented image, by `@forgeron/shaders` preset id. Not part of parity. */
  post?: string[];
  labels?: boolean;
  /** Inputs from the host and from the scene itself. */
  vars?: Record<string, Var>;
  timelines?: Record<string, Timeline>;
  machines?: Record<string, StateMachine>;
}

export interface Camera {
  view: Turn;
  fit: {
    fill?: number;
    unit?: "even" | "any";
    /** Frame on these world bounds instead of the non-decor prims (today's village `FRAME`). */
    box?: { min: Vec3; max: Vec3 };
    /** Time and var values at which the framing is computed (today's `fit.at`). */
    at?: { t?: number; vars?: Record<string, number> };
  };
  /** Allowed zoom steps, as multiples of the fitted unit: crisp at every step. */
  zooms?: number[];
  /** Named shots: where to look and how close (today's village `FOCUS`). */
  shots?: Record<string, { at: Vec3; zoom: number; view?: Turn }>;
}

export type Var =
  | { type: "time" } // seconds since the scene started playing; implicit as "t"
  | { type: "progress"; default?: number } // 0..1, written by the host (scroll)
  | { type: "int"; default: number; cycle?: { every: number; count: number } } // "active"
  | { type: "pointer" }; // the hovered tag, written by the engine from the id buffer

// ── Timeline ─────────────────────────────────────────────────────────────────

export type Ease = "linear" | "step" | "smooth" | "glide" | "in" | "out" | "in-out";

export interface Timeline {
  /** Which var drives it: "t" (default), a progress var, or a state's local time. */
  clock?: string;
  /** Length in clock units; a loop wraps at it. */
  length?: number;
  loop?: "loop" | "ping-pong" | "once";
  tracks: Track[];
}

/** Target: an instance path ("line/package") and, for params, the param name. */
export type Track =
  | {
      kind: "key";
      target: string;
      channel: "at" | "turn" | "scale" | `param:${string}`;
      keys: { t: number; v: number | Vec3 | boolean; ease?: Ease }[];
    }
  | { kind: "visible"; target: string; keys: { t: number; v: boolean }[] }
  /** Constant rate: value = phase + rate·clock (gears, fans, cranks). */
  | { kind: "spin"; target: string; channel: `param:${string}`; rate: number; phase?: number }
  /** Glide along a polyline: today's `along` + `glide`. */
  | { kind: "path"; target: string; path: Vec3[]; duration: number; ease?: Ease; delay?: number }
  /** n copies of a part riding a path, evenly spaced: today's `tray` packets and belts. */
  | {
      kind: "conveyor";
      use: string;
      path: Vec3[];
      count: number;
      speed: number;
      /** Added to clock·speed: (clock·speed + phase + k·L/count) mod L (village notes). */
      phase?: number;
      params?: Instance["params"];
    }
  /** On/off pattern: on while floor(clock·rate + seed) mod period < on (today's rack lights). */
  | {
      kind: "blink";
      target: string;
      channel: `param:${string}`;
      rate: number;
      period: number;
      on: number;
      seed: number;
    }
  /** Approach a target value at `rate` per second: today's `stack6` spread. */
  | {
      kind: "spring";
      target: string;
      channel: `param:${string}`;
      to: { if: string; then: number; else: number };
      rate: number;
    }
  /** A value from a number or a root param, by float64 operations in order (village notes). */
  | {
      kind: "calc";
      target: string;
      channel: `param:${string}`;
      from: number | `@${string}`;
      ops: CalcOp[];
    };

// ── State machine ────────────────────────────────────────────────────────────

export interface StateMachine {
  initial: string;
  states: Record<
    string,
    {
      /** Timelines that play while in this state (their clock restarts on entry unless `clock` says otherwise). */
      play?: string[];
      /** Camera shot to move to, eased over `move` seconds. */
      shot?: string;
      /** Var values set on entry. */
      set?: Record<string, number>;
    }
  >;
  transitions: {
    from: string | "*";
    to: string;
    when:
      | { var: string; range: [number, number] } // a progress window (village steps)
      | { var: string; equals: number } // active = 3
      | { after: number } // seconds in the state
      | { event: string }; // named host event ("hover:stack", "click:cta")
    /** Dither-dissolve between the two pictures (pixels switch whole, never fade). */
    dissolve?: number;
  }[];
}
```

### Rigs

Rigs are the procedural parts of `parts.ts`, ported to Rust operation for operation so they can reach exact parity.

| Rig        | Settings (`with`)                                                              | Channels (animatable) | Today                         |
| ---------- | ------------------------------------------------------------------------------ | --------------------- | ----------------------------- |
| `wheel`    | `c`, `r`, `plane` ("xy", "yz", "xz"), `teeth`, `tooth`, `spokes`, `hub`, `ink` | `angle`               | `wheel`, `rim`                |
| `arm`      | `base`, `l1`, `l2`, `ink`                                                      | `target` (Vec3)       | `arm` (two-link IK, elbow up) |
| `fan`      | `c`, `r`                                                                       | `angle`               | `fan`                         |
| `piston`   | `c`, `axis` ("x", "y"), `r`, `rod`                                             | `angle`               | `piston`                      |
| `pendulum` | `pivot`, `length`, `plane`, `ink`                                              | `angle`               | `pendulum`                    |
| `smoke`    | `top`, `n`, `seed`, `rise`, `thick`                                            | clock                 | `village.ts` `smoke`          |
| `sparks`   | `at`, `n`, `seed`, `spread`                                                    | clock                 | `village.ts` flames, sparks   |
| `burst`    | (none)                                                                         | `b`                   | `village.ts` blast particles  |
| `mushroom` | (none)                                                                         | `b`, `fire`, clock    | `village.ts` mushroom cloud   |
| `pile`     | `at`                                                                           | `g`                   | `village.ts` ticket pile      |

A rig exposes computed sockets (`arm.wrist`, `wheel.rim`, `pendulum.bob`) that other instances can snap to each frame.

### A complete small file

```json
{
  "$schema": "https://blueprint.forgeron.sh/schema/v1.json",
  "version": 1,
  "id": "examples/rack-room",
  "parts": {
    "rack": {
      "params": { "light": { "type": "flag", "default": false } },
      "prims": [
        {
          "kind": "box",
          "at": [-1.4, -1.4, 0],
          "size": [2.8, 2.8, 8],
          "floors": 1,
          "tone": [0.04, 0.1, 0.22]
        },
        {
          "kind": "dot",
          "at": [1.4, 0.6, 1.5],
          "size": 1,
          "ink": { "if": "@light", "then": "accent", "else": "dim" }
        }
      ],
      "sockets": { "top": { "at": [0, 0, 8], "facing": "+z" } }
    },
    "packet": { "prims": [{ "kind": "dot", "at": [0, 0, 0], "size": 2 }] },
    "gear": {
      "params": { "angle": { "type": "number", "default": 0 } },
      "prims": [
        {
          "kind": "rig",
          "rig": "wheel",
          "with": {
            "c": [0, 0, 0],
            "r": 2.2,
            "plane": "yz",
            "teeth": 15,
            "spokes": 3,
            "hub": 0.5,
            "angle": "@angle"
          }
        }
      ]
    }
  },
  "scenes": {
    "rack-room": {
      "title": "Two racks, a gear and a tray of packets",
      "depth": "zbuffer",
      "camera": { "view": 0, "fit": { "fill": 0.8, "unit": "any" } },
      "filters": { "pixel": 2, "dither": 4 },
      "vars": { "active": { "type": "int", "default": -1, "cycle": { "every": 2, "count": 2 } } },
      "root": {
        "instances": [
          {
            "id": "a",
            "use": "rack",
            "at": [0, 0, 0],
            "tag": "rack-0",
            "params": { "light": false }
          },
          { "id": "b", "use": "rack", "at": [0, 4, 0], "turn": 1, "tag": "rack-1" },
          { "id": "g", "use": "gear", "snap": { "socket": "c", "to": "a.top" } }
        ]
      },
      "timelines": {
        "idle": {
          "tracks": [
            { "kind": "spin", "target": "g", "channel": "param:angle", "rate": 1.4 },
            {
              "kind": "blink",
              "target": "a",
              "channel": "param:light",
              "rate": 2,
              "period": 7,
              "on": 2,
              "seed": 0
            },
            {
              "kind": "conveyor",
              "use": "packet",
              "path": [
                [3, -2, 9],
                [3, 6, 9]
              ],
              "count": 4,
              "speed": 3
            }
          ]
        }
      },
      "machines": {
        "highlight": {
          "initial": "idle",
          "states": {
            "idle": { "play": ["idle"] },
            "rack-1": { "play": ["idle"], "set": { "active": 1 } }
          },
          "transitions": [
            { "from": "*", "to": "rack-1", "when": { "event": "hover:rack-1" } },
            { "from": "rack-1", "to": "idle", "when": { "event": "leave" } }
          ]
        }
      }
    }
  }
}
```

### From today's code to the format

| Today (`parts.ts`, `objects.ts`)                    | In the format                                                                                              |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `seg`, `polyline`                                   | `line` prim with two or more `points`                                                                      |
| `dot`, `box`, `block`                               | `dot`; `box` with `anchor: "corner"` or `"base-centre"`                                                    |
| `wheel`, `fan`, `arm`, `piston`, `pendulum`, `rim`  | `rig` prims; `rim`, wrist, bob are rig sockets                                                             |
| `rack(out, x, y, t, seed)`                          | a `rack` part + a `blink` track per light                                                                  |
| `tray(out, a, b, t, speed, n)`                      | two `line` prims + a `conveyor` track                                                                      |
| `along`, `pathLength`, `glide`, `lerp3`             | `path` track with `ease: "glide"`; key interpolation                                                       |
| an object `server(out, at, s, on, t)`               | a part with params (`on`), placed by an instance (`at`, `scale: s`); its `t` parts become tracks           |
| a scene function `resources(t, active)`             | a scene: an assembly, a `vars.active` with `cycle`, timelines                                              |
| `raise(out, from)`, `lift(out, from)`, `layer:`     | painter mode: folded into `layer` exactly. Z-buffer mode: not needed (a decal 0.02 off its face is nearer) |
| `villageStore.progress`, `STEPS`, `FOCUS`, `FRAME`  | `vars.progress`, a machine whose transitions are progress ranges, `camera.shots`, `camera.fit.box`         |
| `lineStore.progress`                                | `vars.progress` driving a `path` timeline (`clock: "progress"`)                                            |
| `stack6` spread (`spreadNow`, `dt·9`)               | `spring` track with `rate: 9`                                                                              |
| `hash(n)` noise (`sin(n·127.1 + 311.7)·43758.5453`) | inside rigs only (`smoke`, `sparks`, blink seeds), same formula                                            |

Conversion happens in two passes, so parity never depends on taste:

1. **Mechanical** (`packages/blueprint/src/format/convert.ts`, run by `scripts/blueprint/convert-site.ts`): run each scene function at many sampled `t`, `active` and progress values; blocks that never change become prims of a flat part, with the **exact** float64 values the code produced; blocks that change are reported per scene (which helper produced them, how they vary). Output: `packages/libraries/blueprints/<scene>.bp` and a report.
2. **By hand, per object**: the varying blocks are rewritten as rigs and tracks, and the flat parts refactored into reusable parametric Parts (`server`, `cabinet`, `vault`…). A refactor that changes the last bit of a coordinate can flip a pixel, so each refactor runs the parity suite; a non-zero diff is either fixed (keep the original operation order) or shown to the owner.

## 3. Runtime architecture

### Crates and packages

```text
crates/
  fg-math         rlib. Vec3, quarter turns, iso projection, depth key, js_round, trig (libm), hash
  fg-blueprint    rlib + cdylib (feature "wasm"). SceneBin reader, hierarchy, timelines, machines,
                  rigs, raster with depth, labels, bitmap face, shade (dither, glow), immediate mode
  fg-canvas-core  unchanged (the editor's option); depends on fg-math once it exists, nothing else
  fg-shaders      later (D-149): CPU passes (Floyd–Steinberg, quantisation) on the same buffers

packages/blueprint/
  src/core/       the public TS API (render, renderSvg, blocks, filters as today); backed by the engine
  src/format/     types, schema generation, reader (validate, resolve imports), SceneBin writer, converter
  src/engine/     WASM loader, the scene handle, the inputs and outputs layout, immediate-mode packer
  src/dom/        mount (on the engine), presenters (2D and WebGL2), DOM overlay, field and image (until shaders)
  src/react/      <Blueprint>, unchanged API
  src/build/      still frames to SVG and PNG, sprite sheets, at build time (Node, Bun, Workers)
  src/canvas/     the @forgeron/canvas integration (phase 5)
  wasm/           fg_blueprint.wasm and its glue (built artefact, see question 2)
  schema/         blueprint.v1.json
  test/parity/    the parity suite
```

**`fg-blueprint` does not reuse `fg-canvas-core`.** That crate's grid index answers "which of 20,000 items are under this point or box". A blueprint scene has at most a few thousand prims, all projected every frame; culling is one bounding-box test per instance against the raster, and the per-frame cost is in rasterising, not in finding. What both need is the math, so it moves to `fg-math`. Two separate `.wasm` modules also keep the site from loading editor code.

### What lives where

| Rust (`fg-blueprint`)                                                                | TypeScript (`@forgeron/blueprint`)                                                        |
| ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| scene state after load: instances, params, vars, machines                            | JSON reading, validation with messages that name the path, import resolution              |
| per frame: machines, timelines, rigs, transforms, cull, order, raster, labels, shade | writing SceneBin (a compact binary of the resolved file)                                  |
| the id buffer and hover tag lookup                                                   | presenters: 2D canvas or WebGL2 (palette, integer upscale, grid gap, post passes)         |
| immediate mode: rasterise a packed block list                                        | observers (size, visibility, reduced motion), the clock, CSS tokens, host inputs (scroll) |
| still and sheet rendering for the build                                              | SVG string (`toSvg`, unchanged), PNG encoding (`CompressionStream`), the DOM overlay      |

The JSON is parsed in TypeScript, not in Rust: a JSON parser (serde) would cost 60–100 KB of WASM, and validation messages are better where the authoring tools live. Rust reads **SceneBin**: a header (magic, version), a string table, then flat arrays of parts, prims, instances, tracks and transitions, every number as float64. Its layout lives in one file, `packages/blueprint/src/engine/layout.ts`, from which `crates/fg-blueprint/src/layout.rs` is generated (`scripts/blueprint/gen-layout.ts`), with a test that fails when the two disagree.

### The frame

The host writes its inputs into a block of WASM memory (time, `dt`, var values, pointer position in raster pixels), then makes **one call**: `frame(handle)`. Inside:

1. **Machines**: fire transitions (progress windows, `after`, events queued by the host), enter states, set vars, start timelines, start camera moves.
2. **Timelines**: evaluate every playing track on its clock into channel values (params, `at`, `turn`, `scale`, visibility). Springs integrate with the frame's `dt`.
3. **Rigs**: generate their prims from their channels; resolve rig sockets and socket snaps.
4. **Transforms**: walk the instance tree; world prim = parent transform ∘ (scale, quarter turn, translation). Prims are written into a reused arena: no allocation per frame once warm.
5. **View**: apply the camera's quarter turn about the framing centre, then project with the fitted `u` and origin. The fit is computed on resize and when the camera changes shot, never per frame, so nothing jitters.
6. **Cull**: drop instances whose projected bounds miss the raster (labels excepted: placement needs them all).
7. **Order**: painter mode sorts by `(layer, depth key)` with a stable sort and today's exact keys; z-buffer mode does not sort (labels still go last).
8. **Raster**: faces by convex fill at pixel centres, then details, edges and dots, Bresenham walked from the upper end, dashes counted from there, writing material, slot, tone, **tag id** (u16) and, in z-buffer mode, depth.
9. **Labels**: placement against the occupied pixels, then drawn (same rule as `placeLabels`).
10. **Shade**: dither faces by Bayer 2/4/8, glow; output the colour slot per pixel (u8).
11. **Outputs**: a small block: changed vars (for `onActive`), current state names, the hovered tag, a "picture changed" flag.

Then TypeScript reads the outputs block and hands the slot buffer to the presenter as a typed-array view on WASM memory (no copy). A frame whose inputs did not change (a still scene, reduced motion) is not computed.

### Depth

| Mode      | How                                                                                                                                                                                                                                                                                                                                                           | Used by                                                                     |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `painter` | today's order, bit for bit: `layer`, then the painter's key, stable                                                                                                                                                                                                                                                                                           | every converted scene, so parity is exact; `raise`/`lift` survive as layers |
| `zbuffer` | per-pixel depth `d = x + y + z` in the camera's turned frame (the 2:1 view looks along (1, 1, 1), so `d` grows towards the viewer and is affine across a face). A pixel is written when `d ≥ stored − bias`; edges, details and dots get a bias of 0.05 units over faces so a box's outline wins over its own faces and a decal wins over the face it sits on | new scenes; old scenes one by one, as a reviewed visual change (question 1) |

The depth buffer is `f32`, one per raster pixel, cleared each frame.

### Rendering choice: a CPU raster in Rust, presented by the GPU

Two paths were weighed:

|                                                            | **CPU low-res raster with a depth buffer, uploaded as a texture** (chosen)                                                                | GPU instanced iso sprites with depth                                                                               |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Pixel parity with today                                    | exact: the same algorithm, ported line for line (fill at pixel centres, Bresenham from the upper end, label placement reading the raster) | not reachable: GPU rasterisation rules, line drawing and dash phases differ from the current code and between GPUs |
| Static SVG and PNG at build                                | the same code produces the buffer in Node; `toSvg` is unchanged                                                                           | needs a second, CPU renderer that must agree with the GPU one, which `design.md` already rejected                  |
| Dither confined to faces, labels placed around the drawing | natural: materials per pixel, occupancy is readable                                                                                       | needs extra passes and a readback for label placement                                                              |
| Cost                                                       | raster ≤ 720 × 450 = 324,000 pixels; filling a few thousand prims is a few ms in TS today, an estimated 0.5–2 ms in Rust                  | lower CPU, but the CPU part is already small at this resolution                                                    |
| The pixel style                                            | whole pixels by construction                                                                                                              | needs snapping in the vertex shader, still at the mercy of rasterisation rules                                     |

The GPU does what it is good at: palette lookup, integer upscaling, the grid gap, `@forgeron/shaders` post passes, compositing. The CPU work it would save is small at these resolutions, and it would cost the parity, the SVG output and the materials.

### WASM API

wasm-bindgen 0.2.130, as `fg-canvas-core`. Every call takes or returns numbers; bulk data goes through pointers into linear memory.

| Call                                                                                 | When                          | Does                                                                                 |
| ------------------------------------------------------------------------------------ | ----------------------------- | ------------------------------------------------------------------------------------ |
| `alloc(len) → ptr`                                                                   | load                          | room for a SceneBin or an immediate block list                                       |
| `load(ptr, len) → handle` (0 = error)                                                | load                          | reads SceneBin, builds the scene state; `error_ptr()`/`error_len()` give the message |
| `resize(handle, w, h) → 0/1`                                                         | size or camera change         | allocates the raster, fits; returns whether the buffer pointers moved                |
| `inputs_ptr(handle)`, `outputs_ptr(handle)`, `slots_ptr(handle)`, `tags_ptr(handle)` | after `load` and `resize`     | stable addresses of the shared blocks                                                |
| `frame(handle) → flags`                                                              | **each frame, the only call** | §3 "The frame"                                                                       |
| `immediate(handle, ptr, len)`                                                        | each frame, script layer only | rasterise a packed block list in the same frame (replaces step 1–4 for that layer)   |
| `free(handle)`                                                                       | unmount                       |                                                                                      |

One instance of the module serves every canvas of a page (one handle each). Memory only grows; handles reuse their buffers across frames.

### TypeScript packages

`@forgeron/blueprint` keeps its public API: `render`, `renderSvg`, `toSvg`, the block helpers, the filters, `mount`, `<Blueprint>`. They accept a `SceneSource` as today (block lists and functions of `{ t, active }` go through immediate mode) **or** a scene from a `.bp` file. The one break: the engine is asynchronous to start, so callers `await initBlueprint()` once (a module script can use top-level await; an Astro frontmatter can too). New subpaths:

| Subpath                      | Contents                                                                                                                                                                                                                                                                                         |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `@forgeron/blueprint/format` | types, `readBlueprint(json, { load })` (validate + resolve imports), `writeSceneBin`, the converter                                                                                                                                                                                              |
| `@forgeron/blueprint/engine` | `initBlueprint(source?)` (a URL, bytes or a `WebAssembly.Module`: Workers forbid compiling from bytes), `createScene(doc, name)` → `{ resize, set, emit, frame, on, slots, tags, dispose }`                                                                                                      |
| `@forgeron/blueprint/dom`    | `mount` on the engine; `play(canvas, scene, options)` with `set("progress", p)`, `set("active", n)`, `release("active")`, `emit("hover:…")`, `on("active", fn)`; presenters; `playInWorker` and `serveBlueprint`, the same player with the engine in a worker (see "Worker and lazy-load notes") |
| `@forgeron/blueprint/build`  | `stillSvg`, `stillPng`, `spriteSheet(scene, { fps, frames })` → PNG atlas + JSON manifest                                                                                                                                                                                                        |
| `@forgeron/blueprint/canvas` | phase 5: `blueprintKind`, `<BlueprintLayer>`                                                                                                                                                                                                                                                     |
| `@forgeron/blueprint/vite`   | `blueprint()`, a Vite plugin (Node): `import x from "./a.bp"` (the file) and `"./a.bp?compiled"` (its scenes as SceneBin, built at build time; see "Extension and build-time compile notes")                                                                                                     |

The site's `isoCanvas(el)` handle keeps its three methods (`select`, `show`, `onActive`) on top of `play`, so page scripts do not change.

**Presenters.** Browsers cap live WebGL contexts per page (about 16 in Chrome), and the home page has about 25 iso canvases. So:

- `present2d` (default for page canvases): Rust paints RGBA from the slots and the resolved palette; `putImageData` and an integer `drawImage`, as `mount` does today. One shared module, no context per canvas.
- `presentWebGL2` (full-screen scenes, the editor, any scene with `post` passes): the slot buffer as an `R8UI` texture uploaded from the WASM view, a palette uniform, a full-screen triangle that upscales by an integer, draws the grid gap, then runs the post passes. At most 4 per page; beyond that `mount` falls back to 2D.

Both read the palette from CSS tokens on the canvas at mount and resize, as today.

### On `@forgeron/canvas`

A Blueprint scene is **an item kind and a layer**, not a replacement renderer: the canvas keeps its engine (D-148), its DOM renderer and its overlay.

- `blueprintKind`: an item whose `data` is `{ file, scene, view }` and whose bounds are the scene's fitted raster at zoom 1.
- `<BlueprintLayer>` goes in the canvas's `layers.below`. It owns one WebGL2 presenter for all blueprint items in view. Pan moves the picture by whole screen pixels. Zoom maps to the scene's unit: between steps the picture is scaled by an integer, at a step the engine re-fits at the new unit, so pixels stay crisp at every zoom.
- The canvas viewport never reaches into Rust: the layer turns it into `resize` and camera inputs.
- Dependency rule to add: `canvas-does-not-import-blueprint` (blueprint's `/canvas` subpath may import canvas, never the reverse).

### DOM overlay, accessibility and input

- **Hover** is a lookup, not a call: the pointer, in raster pixels, indexes the `tags` view directly; the tag's name comes from the string table read at load. The page gets `hover:<tag>` and `leave`; the engine also sets the `pointer` var for machines. This replaces the hand-measured band of `stack6` (§4, phase 4, keeps it until then).
- **Labels** stay pixels in the raster (parity, and the style). The overlay adds, per label and per tagged instance, a visually hidden element positioned at its anchor: the canvas gets `role="img"` with the scene's `title` and `description`, labels become a list, and legends stay the page's own DOM (`[data-res]`, `[data-layer]`), driven by `on("active")`.
- `prefers-reduced-motion`: the clock stays at 0; progress and hover still change the picture; dissolves become cuts.

### Build-time output

The same `fg-blueprint.wasm` runs in Node, Bun and Workers (module import there). `@forgeron/blueprint/build`:

- **SVG**: the slot buffer through `toSvg` (one path per slot, `fill="var(--token, fallback)"`): themeable without JavaScript.
- **PNG**: RGBA from Rust, encoded in TypeScript with `CompressionStream("deflate")`, which every target has (no `node:zlib`, so the core keeps its rule).
- **Sprite sheet**: N frames of a looping scene in one atlas + a manifest; a 1 KB flipbook player in `/dom` plays it for a page that should not load WASM. Scenes whose periods never repeat (`machine`) stay live.

## 4. Phases

Each phase ships on its own, behind the existing API, and ends green on `bun run check`. Perf numbers are on the M4, quiet machine, p95, release WASM (`opt-level = "z"` + `wasm-opt -Oz`); every perf test also records the numbers into `target/bench/blueprint.json`.

### P1: format, reader, converter (TypeScript only)

- `packages/blueprint/src/format/{types.ts,read.ts,flatten.ts,convert.ts}`, `schema/blueprint.v1.json` (generated by `scripts/blueprint/gen-schema.ts`), `docs/blueprint/format.md` (the normative spec, from §2).
- `flatten.ts`: a TS reference evaluator for **still** scenes (params, instances, turns, snaps; no timelines): `flatten(doc, scene, vars) → Block[]`. It is the converter's test oracle and the format's executable definition.
- `scripts/blueprint/convert-site.ts`: the mechanical pass over every scene of `SCENES`; writes `packages/libraries/blueprints/*.bp` and `target/blueprint/convert-report.md` (static vs varying blocks per scene, by helper).
- **Tests**: schema accepts §2's example and rejects 12 malformed files with the path in the message; import resolution (cycle, missing name, prefix clash); round trip `read(write(doc))`; for every scene and sample, `flatten(converted)` equals the static blocks of the original **as values** (`toStrictEqual`, float64 exact), and the TS renderer draws the same frame from both.
- **Done**: 42 scenes converted for their static part; the report says what each one still needs in P3.

### P2: Rust core and rasteriser, parity on still frames

- Toolchain in CI and moon: `rust-toolchain.toml` (exists), a moon project `crates` with tasks `test` (`cargo test`), `clippy`, `wasm` (`scripts/blueprint/build-wasm.ts`, following `packages/canvas/bench/build-wasm.ts`); `.prototools` notes rustup.
- `crates/fg-math/src/{lib,vec,iso,num}.rs`; `crates/fg-blueprint/src/{lib,layout,bin,scene,cull,order,raster/{frame,fill,line,dot},boxes,labels,font,shade,immediate,paint,wasm}.rs`. `font.rs` is generated from `packages/font/src/index.ts` (`scripts/blueprint/gen-font.ts`, checked in sync by a test).
- Port rules: float64 for geometry, `js_round(x) = (x + 0.5).floor()` wherever the TS uses `Math.round` (Rust rounds half away from zero), stable sort with the same comparator, `u8` wrap where TS writes a `Uint8Array`.
- The TS reference renderer moves to `packages/blueprint/test/reference/` (unchanged code) and stays until P4 ends. `render()` and `renderSvg()` now call the engine.
- Z-buffer mode built and unit-tested, not used by the site.
- **Tests**:
  - native: the properties of `core.test.ts` ported (fit unit, regular 2:1 edges, dither confined to faces, labels never clipped), z-buffer cases where painter's order fails (interlocking boxes, a decal on a face);
  - contract: SceneBin written by TS and read by Rust gives the same instance tree (debug dump compared); the generated layout matches;
  - **parity, still**: `packages/blueprint/test/parity/still.test.ts` over `samples.ts` (each scene × its real sizes from `sizes.json`, captured once from the site at 1440/1024/768/390 × `t = 0` × `active ∈ {-1, 0, 1, 2}` × labels on/off × the palette options it is mounted with); both through immediate mode (the original functions) and through the P1 data. `material`, `ink`, `tone` and `color` buffers equal the reference **exactly**; a failure writes `target/parity/<case>.png` (reference, engine, diff).
  - perf: `erp-village` at 720 × 450 raster, immediate mode, Rust part ≤ 2 ms; `machine` ≤ 1.5 ms; a card scene ≤ 0.3 ms; `load` of the largest scene ≤ 5 ms; `.wasm` ≤ 150 KB raw, ≤ 60 KB gzip (a test reads the file size).
- **Done**: every scene of the parity list renders still frames identical to today from the Rust core, in both inputs; the site still runs on the TS engine.

### P3: timelines, rigs, the player; parity on animated frames

- `crates/fg-blueprint/src/{timeline,tracks,machine,vars,rigs/{wheel,arm,fan,piston,pendulum,smoke,sparks}}.rs`; trig through the `libm` crate (fdlibm, as V8's `Math.sin`).
- `packages/blueprint/src/engine/*`, `src/dom/{play,present-2d,present-webgl2,overlay}.ts`.
- By-hand conversion of the varying blocks, scene by scene, from the P1 report, starting with the cards (small, loop in `t`) and ending with `machine` and `erp-village`. A scene not yet converted keeps its function on the **script layer**: the engine draws it in immediate mode, so it already benefits from the Rust raster.
- **Tests**:
  - unit: each track kind and ease against hand values; machines (progress windows, `after`, events, `*` transitions); `spring` with a fixed `dt` sequence equals the `stack6` formula;
  - **parity, animated**: `t ∈ {0, 0.37, 1.7, 4.3, 9.2, 31.4}` × `active` sweep × progress `∈ {0, 0.05, …, 1}` for scroll scenes, stateful scenes driven by a fixed sequence of `dt = 1/60`; exact equality, under Node (V8 and `libm` share fdlibm). A scene enters the "data" column of `test/parity/status.md` only when it passes;
  - presenters: in headless Chrome, `readPixels` of the WebGL2 presenter equals the RGBA of the 2D presenter for 10 scenes;
  - perf: `play` frame (inputs → present) ≤ 3 ms for `erp-village` full screen, ≤ 0.5 ms for a card; exactly one `frame` call per drawn frame (a spy); no JS allocation in the loop (heap delta over 600 frames ≈ 0 under `--expose-gc`).
- **Done**: every routed scene renders animated frames identical to today, from data or from the script layer; status table filled.

### P4: scroll and hover machines, the site switch

- The village: `vars.progress`, a machine with the 14 `STEPS` as progress windows, `camera.shots` from `FOCUS`, `fit.box` from `FRAME`. The camera stays the page's CSS transform at switch (question 3); the page reads the current shot from `on("state")` instead of recomputing it.
- `production-line`: `vars.progress` on a `path` timeline; the page's stop highlight from `on("state")`.
- `resources`: `vars.active` with `cycle`; legend through `set`/`release`/`on`. `stack6`: `spring` + `set("active")`; its pointer band stays in the page until the id-buffer hover is approved as a behaviour change.
- `apps/site/src/illustrations/canvas.ts` moves to `play`; `isoCanvas` keeps its API. Then the TS reference renderer is deleted and the parity cases are frozen as buffer hashes in `packages/blueprint/test/parity/golden.json`.
- `flat.ts` and `hearth.ts` stay TypeScript renderers (question 4): their per-cell programs gain nothing from data, and they already meet their frame rates. They may adopt `present2d` later.
- **Tests**: the harness of `packages/blueprint/docs/migration.md` (headless Chromium, frozen clock), before and after: `/`, `/pricing`, `/machine`, `/wild-erp` at 1440/1024/768/390, reduced motion, `t = 1.7` and `t = 4.3`, the saga scrolled to the middle of each of its 14 steps, the develop track at its three stops, each legend row hovered: **every canvas identical**, no new console error, 0 draws per second off screen. Perf: home page main-thread time per frame with the saga visible ≤ 4 ms (today it can exceed 16 ms during the explosion). Weight: report the JS + WASM delta of the home page (gzip).
- **Done**: the site runs on the engine with no visible change; D-150 records the switch.

### P5: canvas integration and the viewer

- `packages/blueprint/src/canvas/{kind.ts,layer.tsx,viewer.tsx}`; rule `canvas-does-not-import-blueprint` in `.dependency-cruiser.cjs` with a case in `scripts/deps-selftest.ts`; a page `apps/ui-gallery/src/pages/editors/blueprint.astro`.
- The viewer: open a `.bp`; list parts, assemblies, scenes; four view buttons; play, pause and scrub a timeline; set vars; hover shows the tag. Chrome from `@forgeron/ui`.
- Z-buffer review sheets: each converted scene rendered in both depth modes side by side, for the owner's decision per scene.
- **Tests**: the canvas engine contract (`engine-contract.ts`) unchanged and green; viewer in jsdom (load, switch view, scrub); hover tag under the pointer at 3 zooms; perf: a view switch draws in the next frame, pan of a full-screen scene at 60 fps with ≤ 1 re-fit per zoom step.
- **Done**: `/editors/blueprint` in the gallery shows any site scene in four views.

### P6: `blueprint.forgeron.sh`

- `apps/blueprint` (Astro, `moon.yml`, `tsconfig.json` extending `@forgeron/tsconfig`, `wrangler.jsonc`, an entry in `docs/ARCHITECTURE.md`): format docs from `docs/blueprint/format.md`, the schema at `/schema/v1.json`, the Part library with static SVG previews built from the same core at build time, the viewer of P5. Later: the scene composer and the timeline editor on canvas.
- **Tests**: `astro check`, build, every library part renders a non-empty SVG at build, links checked.
- **Done**: the site is deployed as a release (not by deploy commands).

## 5. Risks

- **Float and trig determinism.** Exact parity needs the same float64 operations in the same order. Arithmetic is exact in both languages; `Math.round` is not (handled by `js_round`); `sin`, `cos`, `hypot` may differ by one ulp between JavaScript engines and Rust, and a one-ulp difference can flip a pixel at a rounding edge. `libm` and V8 both derive from fdlibm, and the suite runs under Node; Bun (JavaScriptCore) may differ, so parity is defined against Node.
- **The conversion is the bulk of the work**: 5,500 lines of imperative scenes. The script layer means the switch never waits for it; the status table shows what is data and what is still a function.
- **WebGL context limits** on pages with many canvases: the 2D presenter is the default, WebGL2 is opt-in per canvas, at most 4.
- **Toolchain**: Rust, `wasm-bindgen` pinned to the crate's exact version, `wasm-opt`, in CI and for anyone who touches the crates. Workers cannot compile WASM from bytes: the loader takes a `WebAssembly.Module`.
- **Stateful scenes** (`stack6`'s spring) depend on frame timing; their parity is defined on a fixed `dt` sequence, not on wall-clock captures.

## 6. Questions for the owner

Answered on 18/11/2026: the owner took every recommendation below (recorded in D-150).

1. **Depth after the switch.** Converted scenes keep painter's order (with today's layers) so the switch is invisible. Move them to the z-buffer later? _Recommended_: yes, one scene at a time, each with a before/after sheet you approve; new scenes start in z-buffer mode.
2. **The built `.wasm` in the repository?** _Recommended_: commit `packages/blueprint/wasm/` (about 100 KB), with a CI task that rebuilds it and fails on any byte difference. The site, the Workers build and anyone working only in TypeScript then need no Rust.
3. **The village camera.** Today it is a CSS transform that scales the raster by 1.35–1.9, so pixels are uneven while zoomed. _Recommended_: keep it at the switch (parity), then move the camera into the engine (zoom by whole units, crisp pixels, a slightly different motion) as a visual change you approve.
4. **Scope of parity.** _Recommended_: the routed scenes and the footer are the gate. The unrouted `src/explorations/` scenes go through the script layer (cheap) and are converted to data only if reused. `flat.ts` and `hearth.ts` stay TypeScript.
5. **Names.** _Recommended_: `blueprint.forgeron.sh` (singular, the product's name), files `*.bp`, the schema URL `https://blueprint.forgeron.sh/schema/v1.json`.

## P1 notes

Built on 18 November 2026: `packages/blueprint/src/format/` (`types`, `schema`, `validate`, `read`, `flatten`, `write`, `convert`), exported as `@forgeron/blueprint/format`; `packages/blueprint/schema/blueprint.v1.json`; [`format.md`](format.md); `scripts/blueprint/{gen-schema,convert-site}.ts`; `apps/site/src/illustrations/library/` (42 `.bp`, `samples.ts`, `library.test.ts`). Where the design was silent or did not hold, the smallest choice was made:

1. **The schema is data, not generated from the types.** Generating JSON Schema from TypeScript needs a generator dependency. `src/format/schema.ts` states the schema as an object; `gen-schema.ts` writes it; `validate` interprets that same object (the subset of JSON Schema 2020-12 it uses), so the published schema and the reader cannot disagree. A test fails when the written file is stale. `types.ts` mirrors it by hand; the tests on the §2 example and on converted files keep them together.
2. **The converter runs under Node.** Under Bun, `Math.sin`/`cos`/`hypot` gave values one ulp away from V8's for some scenes (`5.510778793854958` against `…959`), the risk §5 names. `convert-site.ts`, started by Bun, bundles itself with rolldown (already a root dependency) and runs under Node; vitest runs under Node too. P2's parity must stay on Node.
3. **Equality is modulo two invisible differences**: a `false` flag equals an absent one, and -0 equals 0 (JSON cannot write -0). `normalizeBlock` applies both to the originals; `flatten` never emits either.
4. **`look` stayed one at a time**: no static block of any scene combines two of accent, signal, alert, ghost (the converter would refuse it).
5. **`rig.with` takes name strings** (`"plane": "yz"`, `"axis": "x"`), which the §2 type did not allow; a string there may not start with `@`.
6. **The §2 example snaps the gear by `"c"`**, the wheel rig's centre, which is not a declared socket. Rig sockets need names in P3 (`c`, `rim`, `wrist`, `bob`); until then `flatten` reports it as a missing socket.
7. **Boxes under quarter turns**: `tone` is `[top, y-facing, x-facing]`, so an odd turn swaps left and right; `vents` turn with their face, are dropped on a hidden face (−x, −y) and are an error on +y until the renderer draws left vents. `camera.view` turns about the origin (the fit re-centres anyway).
8. **State not listed in §1**: the village's walkers are a simulation over the frames' history (`simT`, `stepWalkers`), not a function of `t`. Samples are therefore evaluated in a fixed order from a fresh module (`samples.ts`, shared by the script and the test); each sample is drawn twice and the second picture kept, which also settles `stack6`'s spring on its target. P3: the walkers stay on the script layer, or replay deterministically from `t = 0`.
9. **Scope**: all 42 scenes of `SCENES` are converted for their static part (the 28 routed ones of §1 and the 14 explorations: their static part cost nothing more). `stack6` has no static block (every plate breathes with `t`); `erp-village` keeps 578 of 1,017–9,859 blocks static over its progress.
10. **Static means static over the samples**: 16 times × the active sweep (when `active` changes the picture), or 6 times × 33 progress values for the two scroll scenes. A block constant there but moving elsewhere would be misfiled; P2's still parity and P3's animated parity catch it.
11. **The site test** compares the first sample with `toStrictEqual` and every other one by exact text (JSON of sorted entries, one shortest form per float64), and the frames buffer by buffer: `toStrictEqual` over ~100,000 blocks and four frame buffers per scene took 150 s, the text 8 s.

For P2: `writeSceneBin` (listed under the `/format` subpath in §3) is not written yet. The converted scenes carry no `fit.fill`, `labels` or palette: those are chosen by the pages (`data-*`), so `sizes.json` must record them. `FRAME` and `FOCUS` are not converted (P4). The report, regenerated by `bun scripts/blueprint/convert-site.ts`, is `target/blueprint/convert-report.md` (not committed).

## P2 notes

Built on 18 November 2026: `crates/fg-math` (`iso`, `num`, `vec`), `crates/fg-blueprint` (`bin`, `block`, `boxes`, `cull`, `font`, `immediate`, `labels`, `layout`, `order`, `paint`, `raster/{frame,fill,line,dot}`, `render`, `scene`, `shade`, `stage`, `wasm`), the moon project `crates` (`test`, `clippy`, `wasm`, `wasm-check`), `scripts/blueprint/{build-wasm,gen-layout,gen-font}.ts`, `packages/blueprint/src/engine/` (`layout`, `pack`, `codegen`, the loader), `writeSceneBin` and `describeScene` in `src/format/scenebin.ts`, the module in `packages/blueprint/wasm/`, and `packages/blueprint/test/{reference,parity}/`. Still parity holds on every routed scene, in both inputs (632 cases, all equal). Where the design was silent or did not hold, the smallest choice was made:

1. **`mount` keeps the TypeScript raster.** `render` and `renderSvg` call the engine, but `mount` draws the site's canvases and the site must not switch before P4: it calls `renderTs`, today's code, still in `src/core/`. `test/reference/` is a frozen copy of that renderer (the oracle cannot drift with `src/`); P4 deletes both.
2. **The engine starts by itself under Node and Bun** (`process.getBuiltinModule("fs")` reads the module next to the package), so `render` stays synchronous for tests, scripts and SSR. In a browser or a Worker, `await initBlueprint()` first, as designed.
3. **`js_round` is ECMAScript's rule** (`floor`, then up when the remainder is ≥ 0.5), not `(x + 0.5).floor()`, which gives 1 for 0.49999999999999994.
4. **SceneBin** resolves parameter names to indices of their scope; a scene's root scope is `t`, its `int` and `progress` vars, then the root's params (as `flatten`). `writeSceneBin(lib, scene, { fill, unit, labels })` takes the page's options, since the converted scenes carry none. Rigs and sprites are written but skipped by the Rust `flatten` (P3); vents on a +y face are dropped silently in Rust (the TypeScript `flatten` refuses them). A scene without `filters.dither` is dithered by 4, as every site canvas.
5. **Contract**: `describeScene` (from the library) and `describe` (from what Rust read) print the same tree; the Rust `flatten` packs the blocks the TypeScript `flatten` packs, word for word. The layout lives in `engine/layout.ts`; `layout.rs` and `font.rs` are generated, and `engine.test.ts` fails when they are stale.
6. **Tags**: a u16 per pixel (string index + 1); a prim takes its own tag or its nearest tagged instance's. Immediate blocks carry none.
7. **Z-buffer**: depth is sampled on a face at the pixel's own point (where `plot` puts a line's pixel), a block's lines and dots always win over its own faces (a per-pixel owner), and against other blocks they get 0.05 + 1.25/u units of bias: rounding a point to its pixel costs up to half a pixel along the steepest face gradient (2.5/u per pixel), more than 0.05 at every unit. So a line up to that far behind another block's face shows through: acceptable for decals, to revisit with the per-scene review sheets (P5).
8. **Faces fill by runs.** Testing every pixel of a face's bounding box at the centre cost more than the budget. Each edge's cross product is monotone in x (float operations are), so on a polygon with an area the passing pixels form one run per row: the run's ends are found with `fillConvex`'s own test from an estimate, the inside filled without testing. A polygon of less than 1 px² is tested pixel by pixel. Parity confirms it on every scene.
9. **Speed over size for the raster**: `fg-blueprint` and `fg-math` build at `opt-level = 3` (the workspace's `release` stays `z` for `fg-canvas-core`); `wasm-opt -Oz` still runs. The module is 138 KB raw, 55 KB gzip (budget 150 / 60, checked by a test).
10. **A byte-identical rebuild** needs the same toolchain, wasm-bindgen (pinned), and wasm-opt (binaryen 116 here); paths are remapped (`--remap-path-prefix`) and the glue is written with a banner (`oxlint-disable`) and through `oxfmt`. `moon run crates:wasm-check` rebuilds and compares.
11. **Perf** (release module, Node, M4 with a load average near 40, p50 / p95): `erp-village` 720 × 450 immediate 1.43 / 2.68 ms (budget 2), `machine` 1.49 / 2.72 ms (1.5), a card 0.16 / 0.30 ms (0.3), `load` of the largest SceneBin (`machine`) 0.41 / 0.51 ms (5). The tests report p50 and p95 but fail only when the median passes 3 × the budget (the load's spikes land in the p95: with a cargo build alongside, `machine`'s p95 reached 6 ms); numbers go to `target/bench/blueprint.json`. Natively, quiet or not, `erp-village` rasterises in about 0.7 ms and shades in 0.3 ms.
12. **`sizes.json`** was captured from `astro dev` in iframes 1440, 1024, 768 and 390 wide and 900 tall: `erp-village`'s canvas follows the viewport, so its height is 900 at every width (phone heights are not covered). Palette options (`data-signal`, `data-accent`, `data-bg`) are recorded, but they change `paint`, not the four buffers parity compares.
13. **Where the suites run**: the root `vitest.config.ts` only includes `packages/*/src/**`, so `test/parity/` runs through the package's own configuration (`moon run blueprint:test`, or `bunx vitest run --config packages/blueprint/vitest.config.ts`), not through `bun run check`. Adding `packages/blueprint/test/**/*.test.ts` to the root include would put it in the check (about 3 s). The parity suite imports the site's scenes: `.dependency-cruiser.cjs` allows that for `packages/blueprint/test/parity/` only.
14. **The site's bundle** now carries the glue and emits the `.wasm` as an asset (never fetched): `core/render.ts` imports the engine. It goes when P4 switches `mount`.

For P3: rigs, tracks, timelines and machines on top of `scene.rs`; the frame's inputs and outputs blocks (one call per frame, the `frame` flags); var names in the loader (`createScene(doc, name)`, `set("progress", p)`); how a script layer's immediate blocks interleave with data prims in painter's order (P2 compares the data input on its static part only, as P1 converted it); `hash` and the rigs' trig through `fg_math::num` (`libm`, checked against V8 in its tests).

## P3 notes

Built on 18 November 2026: in `crates/fg-blueprint`, `timeline`, `tracks`, `machine`, `vars` and `rigs/{wheel,arm,fan,piston,pendulum,smoke,sparks}`, the inputs and outputs blocks in `stage.rs`; in `crates/fg-blueprint/raster` (the raster as its own crate, note 12); in `crates/fg-math`, `fdlibm.rs` (sin, cos), `hypot`, `hash`, `pow`, `atan2`; `packages/blueprint/src/engine/{scene,runtime}.ts` (the player's side and the loader), `src/dom/{play,present-2d,present-webgl2,overlay}.ts`; `scripts/blueprint/{by-hand,check-presenters}.ts`; `test/parity/{animated,rigs,player}.test.ts`, `test/parity/status.md`, `test/browser/presenters.page.ts`. Every routed scene plays its animated frames identically to today: 5 from data, 23 on the script layer (`status.md`, 2,256 cases, all equal). `mount` still draws the site with `renderTs`. Where the design was silent or did not hold, the smallest choice was made:

1. **Trig is not `libm`.** V8 and the `libm` crate do not share fdlibm: `libm` follows musl (newer kernels and reduction) and is an ulp away from Node's `Math.sin`/`cos` on 1.6 % of arguments; glibc's and a correctly rounded sine are further (3.4 %). Node 24 (V8 13.6) on arm64 runs V8's own fdlibm port (`src/base/ieee754.cc`) **compiled by clang with floating-point contraction**: every `a·b ± c` in one expression is a fused multiply-add. `fg_math::fdlibm` ports exactly that (`mul_add` where clang fuses; a software `fma` in WebAssembly) and equals Node on a million random arguments in ±200; beyond 2^19·π/2 it reduces in three Cody–Waite steps (no scene goes there). So **parity is defined against Node on arm64**: V8 on x86 compiles the same C without contraction and its `Math.sin` differs there; the engine's frames do not. `pow` (sparks) and `hypot` (V8's Torque algorithm, ported) are checked by the rig tests; `atan2` stays `libm`, unused by the rigs.
2. **One call per frame.** `frame(handle)` is now the per-frame call: it reads the inputs block (time, dt, pointer, queued events, a host value per root scope slot, NaN when unset, and the byte length of a script layer's block list), runs vars → machines → timelines → flatten (rigs, conveyors) → raster → shade → RGBA (when `set_palette` gave a palette: the 2D presenter needs no second call), and writes the outputs block (flags, hovered tag, frame count, the root scope, each machine's state). The script layer packs its blocks straight into the handle's word-aligned block buffer (`block_buffer`, called again only when it grows), so it is one call too. P2's still draw is `draw_scene`; `immediate` stays for `render`. A frame whose picture inputs did not change (the root scope, without `t` unless the root's instances read it, and the tracks' overrides) is not drawn (`FRAME_FLAGS.drawn` clear).
3. **Interleaving the script layer with data.** When a handle has both a scene and a block list, the list's blocks are appended after the scene's (and after its conveyor copies) and the whole is sorted once with the stable painter's sort: at an equal `(layer, key)`, data goes first. A script block that must sit under a data prim at the same key takes a lower `layer`. No routed scene mixes them yet: a scene is either data (converted) or script (its function draws every block).
4. **Two track additions**, needed for exact parity of the cards: `wave` (`base + f(clock·rate + phase)·amp`, sin or cos, `clip` for `max(0, f)`: `web`, `mcp`) and `blink.at`, the first value of the on window (`usage-iso`'s `floor(t·2) mod 4 = row`). A blink's `seed` is added once: `host-servers` computes `floor(t·3 + seed·3 + l·5)`, two additions, and its file adds `seed·3 + l·5` in one; the two differ only where `t·3` sits an ulp from an integer, which no case reaches.
5. **Tracks target definitions.** A target path resolves to an instance record of an assembly's definition: every placement of that assembly moves together. `""` targets the scene's root params. Overrides (`at`, `turn`, `scale`, visibility, params) sit beside the SceneBin, never in it.
6. **Machines**: one transition per machine per frame, in declared order; `"*"` never re-enters the current state; `range` is half-open; a state's `set` holds while it is current and yields to the host's value; the first frame reports the initial state. `pointer` events (`hover:<tag>`, `leave`) come from the tag under the pointer in the last frame.
7. **Framing**: `resize` fits a data scene on its picture at `t = 0` with the host's current values (initial states, springs on their targets), as `frameView` frames a function at `t = 0`; the script layer frames with `frameView` (with the page's `fill` and `unit`, through the engine's `fit`).
8. **Not built**: rig sockets (`arm.wrist`, `wheel.rim`, `pendulum.bob`) cannot be snapped to yet, camera shots and `dissolve` are read but not played (P4: the village keeps its CSS camera), and the overlay lists label texts without placing elements at their anchors.
9. **Conversions** (by hand, `scripts/blueprint/by-hand.ts`): `web`, `mcp`, `cli`, `usage-iso`, `host-servers`. The rest are cards whose motion needs a quotient (`t / 1.2`, which no `rate·clock` reproduces bit for bit), a three-way look, a modulo inside a product, or history (`stack6`, the village's walkers): they stay on the script layer until a track or a refactor of the function says the same thing exactly. `machine` and `erp-village` stay script. The mechanical pass leaves by-hand files alone; `library.test.ts` checks a by-hand file's defaults against the function at `t = 0`.
10. **Parity suites**: `animated.test.ts` (t ∈ {0, 0.37, 1.7, 4.3, 9.2, 31.4} × the active sweep × progress ∈ {0, 0.05, …, 1} for the two scroll scenes, every size of `sizes.json`; `stack6` and the village driven frame by frame at dt = 1/60 from 0, compared at the frames nearest those times; it writes `status.md` when run whole), `rigs.test.ts` (each rig against `parts.ts`, and `smoke`/`sparks` against verbatim copies of `village.ts`'s module-private functions, checked verbatim), `player.test.ts`, `src/engine/player.test.ts` (machines, vars), `src/dom/play.test.ts`. The presenters run in headless Chrome through `bun scripts/blueprint/check-presenters.ts` (`moon run blueprint:presenters`; Bun serves the page, so it is not a vitest suite): WebGL2 `readPixels` equals the 2D presenter's RGBA and the engine's for 10 scenes, and a fifth WebGL2 presenter is refused.
11. **Perf** (Node, M4 loaded, p50 / p95; budget, fail at 3 × the median; the module of note 12): `play` frame of `erp-village` at 720 × 450 on the script layer (its function, packing, raster, paint, present) 2.74 / 4.81 ms (3); a card from data (`usage-iso`, 212 × 139) 0.21 / 0.52 ms (0.5), on the script layer (`dashboard`) 0.12 / 0.40 ms. A data scene's loop grows the heap by a few bytes a frame (the test's own boxed numbers; a view or an image per frame would cost hundreds), measured as the slope between 600 and 3,000 frames under `--expose-gc`; the script layer allocates what its function returns. Numbers in `target/bench/blueprint-player.json`.
12. **The module is back within budget: 141.9 KB raw, 55.9 KB gzip** (budget 150 / 60; it reached 199 / 78 at first). Three changes, the owner's choice: (a) `describe` and `flat_blocks`, the debug and contract outputs, are behind the cargo feature `debug`, built only into a test module, `packages/blueprint/wasm/debug/` (158 KB, committed and checked byte for byte like the shipped one), which `test/debug.ts` loads for the contract and rig tests; (b) the raster (blocks, raster, boxes, cull, order, labels, shade, paint, render) is its own crate, `crates/fg-blueprint/raster` (`fg-blueprint-raster`, the generated `layout.rs` and `font.rs` included from `fg-blueprint/src/` by path, re-exported by `fg-blueprint` under their old paths) and builds at `opt-level = 3`, while `fg-blueprint` (reader, scene, timelines, machines, rigs, stage) builds at `"z"`: a per-package opt-level survives the LTO build; (c) no Unicode tables (`labels::upper` uppercases the face's Latin-1 letters and the few that land there, ß → SS; other scripts have no glyph), no `format!` in errors, and no `libm` reduction for huge trig arguments (`fdlibm.rs` reduces in three Cody–Waite steps there). Perf did not move: `erp-village` immediate 1.48 / 3.30 ms, `machine` 2.17 / 3.55 ms, a card 0.08 / 0.20 ms (P2's suite, p50 / p95); everything at `"z"` cost 70 % on the village. `crates/moon.yml`'s `clippy` task names `-p fg-math -p fg-blueprint`: add `-p fg-blueprint-raster` (outside this phase's files; `cargo test --workspace` already covers it).
13. **Loader**: `engine/index.ts` is now a barrel over `runtime.ts` (the module and the P2 handles) and `scene.ts`, so that `core/render.ts` does not import the player (a cycle). Under Node and Bun the module path is built from `import.meta.url` by hand: jsdom's global `URL` resolves `file:` URLs against `http://localhost`.

For P4: switch `mount` (or `canvas.ts`) to `play` with the 2D presenter; the village's `STEPS` as a machine of progress windows and `FOCUS` as shots read through `on("state")`; `production-line` on a `path` timeline with its stops from `on("state")`; `resources` with `vars.active` and `cycle`; `stack6` with `spring` and `set("active")` (its pointer band stays in the page); rig sockets; more scenes from script to data as their motions are expressed exactly; then freeze the cases into `golden.json` and delete the TypeScript reference.

## P4 notes

Built on 19 November 2026: `apps/site/src/illustrations/canvas.ts` on `play` (2D presenter); `apps/site/src/illustrations/library/control/{erp-village,production-line,resources,stack6}.bp`; a script layer under a data scene (`BlueprintScene.script`, `DataSource.script` of `play`); the home page reads the village's step and the line's stop from `on("state")`; `packages/blueprint/test/parity/{golden.json,golden.ts}`. The TypeScript raster is deleted: `test/reference/`, and in `src/core/` `draw.ts`, `raster.ts`, `shade.ts` and `renderTs`; `mount` draws through `render` (the engine's immediate mode). On the routed pages: 5 scenes play from data (`web`, `mcp`, `cli`, `usage-iso`, `host-servers`), 4 from a control file over their function (`erp-village`, `production-line`, `resources`, `stack6`), 19 on the script layer; `flat.ts` and `hearth.ts` stay TypeScript. Where the design was silent or did not hold, the smallest choice was made:

1. **A control file over a function.** The four scroll and hover scenes keep their pixels in their function (the village's walkers keep the history of every frame, P1 note 8; the line's package hops on the anvil and vanishes at the depot; `stack6`'s plates breathe with `t`; `resources` draws nine objects that move). Their `.bp` holds no prim, only what the page talks to: vars, machines, camera. The function is the scene's script layer (P3 note 3); the scene is then framed on the function's picture at `t = 0`, as `frameView` frames it, with the file's fill and unit, which the page's `data-*` override. `canvas.ts` writes the `progress` the page sets into the module store the function reads (`villageStore`, `lineStore`).
2. **The village**: `vars.progress`; a machine `story` whose 14 states are the `STEPS` windows, `from: "*"`, the last one ending at 1.01 so that it holds at 1 (`range` is half-open); `camera.shots` from `FOCUS`; `camera.fit.box` from `FRAME`. `FRAME` was a box in projected units, never the canvas's framing (the island and its anchor give x −72..72, y −58.5..37.2; `FRAME` says −78..72, −59..37.2); the file holds the world box `[−42, −36, −1.2]`–`[36, 36, 20]`, whose projection gives `FRAME`'s four numbers as the same doubles, and the page derives its camera from it. The engine reads neither: the canvas is framed as before, and the camera stays the page's CSS transform (question 3). `FOCUS.centre` (the step with no caption) stays in the page, shots have no such field. `FOCUS` and `FRAME` left `village.ts`; the captions still follow the `STEPS` ranges, exactly as before.
3. **States reach the page a frame later.** On screen, `on("state")` fires in the frame after the scroll event that changed the progress (the camera eases over a CSS transition anyway). Off screen, and before the first frame, `play`'s `set` on a scene with machines draws one frame at once, so that the state follows the input: a page loaded mid-saga places its camera before the first paint, with no swoop. Such a frame is drawn only when the value changes (`isoCanvas` ignores an equal one): none while idle.
4. **`production-line`**: `vars.progress` and a machine `stops` (`local`, `preview`, `production` over 0–0.33–0.66–1.01); the page lights its stop from the state. No `path` timeline: the package's motion is not expressible exactly as one (above), and it is drawn among the function's blocks, whose order a data prim would change.
5. **`resources`**: `vars.active` with `cycle: { every: 2, count: 9 }` (the page's `data-cycle`, `data-count`). The script layer draws at that var's value, computed by the engine's rule on the host's side (host value, else cycle, else default; a machine's `set` does not reach it), so the picture and the legend never disagree. The legend selects with `set("active")` and hands back with `release`, and follows `on("active")`, the var as the engine output it.
6. **`stack6`**: `vars.active`, set by the legend and by the pointer band, which stays in the page. The spring stays the function's own (`spreadNow`): a `spring` track needs the plates as data.
7. **Not built**: rig sockets (no scene needed them), more conversions from script to data (none was exact without rewriting a function), the overlay on the site (its canvases are `aria-hidden` and the overlay would change the DOM: `overlay: false`).
8. **Start.** `canvas.ts` awaits the engine and reads its libraries at the top level; the page scripts importing it wait for both, so `isoCanvas` stays synchronous for them. Fields and images mount before the await. The iso canvases' first frame comes once the module is compiled, later than `mount`'s synchronous one. `isoCanvas` gains `set`, `on` and `camera`; `select`, `show` and `onActive` are unchanged.
9. **Golden.** Before the reference went, the P2 and P3 suites passed against it in the same tree (88 tests), then wrote the engine's frames as hashes (`BLUEPRINT_GOLDEN=write`, one suite at a time): SHA-256 of the size and the four buffers, 24 hex digits, 632 still cases and 2,256 animated frames. A key names the page's fill, so that `host-cloud`'s two `/pricing` mounts stay apart. The suites now check every case against `golden.json` and that none is missing; `animated.test.ts` also plays `production-line`, `resources` and `stack6` from their control files against the same hashes (the village cannot: a second run does not start from the walkers' state the first one started from). `engine.test.ts`'s "render equals `renderTs`" became an FNV-1a constant, checked equal to `renderTs` on the tree before the deletion. `core.test.ts` keeps the raster properties it can check through `render`; the unit tests of `placeLabels` and `fillConvex` went with them (their ports are native, P2).
10. **Harness** (`packages/blueprint/docs/migration.md`'s method: headless Chromium over CDP, a frozen `performance.now`, a seeded `Math.random`, every canvas hashed from its pixels): `/`, `/pricing`, `/machine`, `/wild-erp` at 1440, 1024, 768 and 390 (900 tall), under reduced motion and at t = 1.7 and 4.3 (every canvas scrolled into view in turn), the saga at the middle of each of its 14 steps (canvas, the camera's transform, the captions shown, the chapter lit), the develop track at its three stops (canvas, stop lit), each legend row hovered with the pointer, and again entered with the canvas in view. 632 + 60 comparisons: identical but for 12. Two are `/wild-erp` at 768 (`flat.ts`, untouched): a second capture of the old build gives the new value. Ten are legend rows hovered while the canvas was off screen in the narrow layouts: `mount.update` used to resize, so clear, an off-screen canvas, `play` keeps its last frame; with the canvas in view all 60 hover cases are identical. No console error before or after; no draw off screen (0 per second for every off-screen canvas, at the top and the middle of each page).
11. **One visible change, under reduced motion only**: `mount` drew one frame and never again on scroll, so the village and the line stayed at their first picture while the page scrolled; `play` draws a frame when the page sets the progress, so they follow the scroll, as §1 states the behaviour. The camera transforms and captions are the same as before.
12. **Perf** (headless, M4 with a load average of 40 to 46; main-thread task time per animation frame over 4 s with the saga on screen, 1440 × 900): before → after, intro 10.1 → 2.9 ms, middle of the story 10.5 → 3.6 ms, explosion 16.1 → 7.6 ms, fire 12.8 → 5.7 ms. The 4 ms target holds outside the explosion and the fire; there the village's function itself (its blocks, P1 §1: 4.4 ms loaded) is most of the frame, which only converting it to data removes. Node, same machine: `play` of the village on the script layer 3.6 / 5.9 ms (p50 / p95), immediate raster 1.9 / 3.8 ms.
13. **Weight** of the home page (JS and WASM fetched, gzip −9): 50.4 KB before (the `.wasm` was emitted, never fetched), 123.2 KB after: JS 66.0 KB (+15.6: the format reader and SceneBin writer, the player, the nine `.bp`, 6.5 KB of them) and the module 57.2 KB. The module is unchanged: 141.9 KB raw, 55.9 KB gzip, rebuilt byte for byte.

## Extension and build-time compile notes

Built on 19 November 2026 (owner's decision, D-150): the format's files are named `*.bp`, and the site plays its scenes from SceneBin bytes compiled at build time. Where the design was silent, the smallest choice was

1. **The extension.** `.bp` instead of `.bp.json`; the content is the same JSON, the same schema, `version: 1`. Media type `application/vnd.forgeron.blueprint+json`. Every file was renamed with `git mv` (46 in `apps/site/src/illustrations/library/`, 4 of them in `control/`; the example and the contract fixture of the package); the converter and the by-hand pass write `.bp`. oxfmt formats them as JSON through `associations` in `.oxfmtrc.json` (`oxfmt --check` sees all 48). The repository tracks no `.vscode/`: the editor association is a hint in `format.md`. Android's Soong files (`Android.bp`) share the extension.
2. **Imports.** `@forgeron/blueprint/vite` (`src/vite.ts`, Node only, outside the neutral entries) is one `load` hook: `x.bp` is the file as written (`export default` its JSON), `x.bp?compiled` is the file read and validated with its imports (relative ones resolved against the file, package paths through Node's resolution; each is watched), compiled, and written as a module. Any other query (`?raw`, `?url`) is left to Vite; Vite's own (`import`, `t`, `v`) pass. It is in `apps/site/astro.config.ts`, the root `vitest.config.ts` and the package's. Types: `src/bp.d.ts`, exported as `@forgeron/blueprint/bp`, referenced from the site's `env.d.ts`. Two imports of one file, two forms: a mode-dependent result would give one specifier two types.
3. **The compiled form** (`format/compile.ts`): `compileBlueprint(lib)` gives, per scene, its SceneBin written with the scene's own fit and labels, and what the player reads besides the bytes: the root scope, the machines' state names, the `active` int var (default and cycle, for the script layer), title, description, the label texts (the overlay) and the camera (the page reads the village's shots and box). The string table is not repeated: `loadScene` reads it back from the bytes. A page's `fill`, `unit` and `labels` live only in the scene record, the SceneBin's last record before the string bytes; `loadScene(compiled, options)` writes them there, which gives the bytes `encodeScene(lib, name, options)` gives (checked).
4. **The module's encoding**, measured on the site's nine files (gzip −9, alone): their JSON 5.5 KB (4.8 minified); the SceneBin in base64 13.4 KB; the raw SceneBin as a hashed asset 9.9 KB and one more request; its words as number literals 7.8 KB; the same with each section's records transposed (field by field, so a field's repeats sit together) **7.1 KB, chosen**: in the built page, 0.6 KB less than untransposed and 6.1 KB less than base64. A SceneBin is about three times its JSON (fixed-width records, every absent field a NaN word), so the bytes alone weigh more than the JSON; what the page saves is the code that reads it. A `B(words, text)` function in each module puts the bytes back (`-0` and `NaN` written as literals: every word keeps its bits); the record sizes come from `engine/layout.ts`, the section order from `SECTIONS` (`format/scenebin.ts`, now exported and used by the writer). The plugin compiles in dev as well (`?import&compiled`).
5. **Playing it.** `play` is split: `dom/player.ts` is the loop (unchanged), `dom/play.ts` makes the handle of `{ lib, scene }` (it imports `createScene`, so the reader's types and the SceneBin writer) and of everything else through `dom/play-compiled.ts`, whose `playCompiled(canvas, { compiled, scene, script? } | sceneFunction, options)` imports only `loadScene` and `createScriptScene`. `BlueprintScene` takes a `SceneInfo` (bytes, strings, scope, machines) and its `active` var instead of the `Scene`'s vars. `canvas.ts` imports the nine files with `?compiled`, calls `playCompiled`, and no longer reads anything before the engine starts.
6. **What the site no longer ships**: the reader (`readBlueprint`, imports), the validator and the schema it walks, the SceneBin writer (`encodeScene`), and the nine files as JSON (checked by grepping the built chunks for their messages and keys). The record table of `engine/layout.ts` stays: the engine's views need it.
7. **Weight** of the home page (JS and WASM fetched, gzip −9, as in P4 note 13): JS 66.0 → 62.2 KB, WASM 57.2 → 57.2 KB, total 123.2 → 119.5 KB.
8. **Parity**: the golden suites (`test/parity/*`, 121 tests) and `library.test.ts` pass unchanged. `library.test.ts` adds, for each of the 46 library files imported both ways through the plugin, every scene: the same bytes as `encodeScene` with and without a page's fit, the same strings and scope, and the same four buffers, root scope and machine states at t = 0, 0.37, 1.7, 4.3 and 9.2 (with `progress` set where the scene has it). `play.test.ts` checks that `playCompiled` puts the same pixels, overlay and hover as `play` on a read library. In headless Chromium, the built home page draws its 21 iso canvases with no console error; the P4 pixel harness was not run again.
9. **Not changed**: the comment of `crates/fg-blueprint/src/lib.rs` still says `.bp.json` (no Rust was to be touched; it changes no byte of the module). Loading the root and the package Vitest configurations now prints Vite's notice that the native config loader would not take the plugin's extensionless TypeScript imports; the default loader runs them.

## Worker and lazy-load notes

Built on 19 November 2026 (owner's decision, D-150): the home page's iso scenes play in a Web Worker, on canvases handed over with `transferControlToOffscreen`, and the engine loads only when the first iso canvas nears the screen. Where the design was silent, the smallest choice was made:

1. **One loop, two drivers.** The frame loop left `dom/player.ts` for `dom/loop.ts` (`loop(scene, presenter, { filters, data, reduced, gl, onDraw }, frames)`), which has no DOM in it: it takes the canvas's CSS size and resolved palette, visibility, the pointer as a fraction of the canvas, `set`, `release`, `emit`. `run` (`play`, `playCompiled`) feeds it from the page's observers as before; `serveBlueprint` (`dom/serve.ts`) feeds it from messages in a worker. So the semantics are the same code on both sides: frames only while visible, the clock held at 0 under reduced motion, a frame handed to the presenter only when the engine flags it drawn, and, off screen, `set` on a scene with machines draws one frame at once. `play`, `playCompiled` and `Player` are unchanged; `present2d` also takes an `OffscreenCanvas` (it then leaves `image-rendering` to the page). `playCompiled`'s handle-making is `compiledScene(source, options)`, which the worker calls too.
2. **Who owns what.** The page (`dom/remote.ts`): `connectWorker(worker)` once, then `playInWorker(canvas, worker, sceneName, options)` per canvas, which returns a `RemotePlayer` (`set`, `release`, `emit`, `on`, `show`, `destroy`). It keeps the inputs: the CSS size and the palette read from the canvas's tokens (`ResizeObserver`), visibility (`IntersectionObserver`), `prefers-reduced-motion` (one media query for the page, its `change` sent to the worker), the pointer (listened only on a data scene, as `run` does), and the values the page sets. The worker owns the engine instance (one for every canvas, as §3 says), every scene handle, every presenter and every frame loop, each loop on the worker's `requestAnimationFrame` (`setTimeout` at 16 ms where a worker has none). The messages (`dom/worker-protocol.ts`): to the worker `mount` (the `OffscreenCanvas`, transferred, the scene's name, options that survive a `postMessage`: filters, `active`, `cycle`, `labels`, `fill`, `unit`, `reducedMotion`; the size, palette and reduced motion), `swap`, `size`, `visible`, `reduced`, `pointer`, `set`, `release`, `emit`, `listen`, `destroy`; back to the page `ready` (with whether the scene takes the pointer), `missing`, `event` (a listened output: `"state"`, `"active"`, a var, `"hover"`) and `error` (logged).
3. **The script layer runs in the worker.** Scene functions cannot cross a `postMessage`, so the page names a scene and the worker's entry resolves the name: `serveBlueprint(resolver, { engine?, scope? })`, with `resolver(name, vars)` giving a compiled source or a scene function; `vars` are the values the page set, which a control file's script reads (the village's and the line's progress). On the site, `illustrations/worker.ts` is that entry (`new Worker(new URL("./worker.ts", import.meta.url), { type: "module" })`, built by Vite as a module worker: `vite.worker` in `astro.config.ts` sets `format: "es"` and the `blueprint()` plugin); it starts the engine at once and imports `illustrations/sources.ts` (the compiled files, `SCENES`, the stores, `sourceOf`, moved out of `canvas.ts`) beside it, so the module's fetch and compile overlap the scenes' download. The page imports no scene function: the village's `STEPS`, which the home page's captions read, moved to `illustrations/steps.ts` (`village.ts` re-exports them).
4. **What the page reads at once.** `isoCanvas(el)` is synchronous again without a top-level await: the handle exists before the engine does, keeps what it is told (`select`, `set`, the listened keys) and applies it when the engine starts. Its `camera` comes from `x.bp?meta`, a new form of the Vite plugin's import: the compiled file without its SceneBin bytes (`BlueprintMeta`: scope, machines' states, `active`, title, labels, camera), so the village's shots and fit box are read synchronously, as before (the nine files' metas: 2.9 KB, 0.9 KB gzip). `on` replays the last value on subscribe at both levels (`RemotePlayer` and `isoCanvas`); the worker, asked to listen after a frame was drawn, sends the output's current value at once, and the page drops an event equal to the last one. States reach the page one message after the frame that reached them (P4 note 3 said one frame on screen; off screen, `set` still draws at once, in the worker, and the state follows a message later). The worker ignores a `set` or `release` of a var a data scene lacks (`isoCanvas`'s former `has`).
5. **Names the page cannot check.** `SCENES` lives in the worker, so `isoCanvas` returns a handle for any canvas with a non-empty `data-iso` (null only for no name), and `show(name)` sends the swap: a name the worker's resolver does not know leaves the canvas as it was (`missing`), where it used to be refused synchronously. Every `data-iso` of the routed pages is known.
6. **Lazy start.** `canvas.ts` observes each iso canvas with an `IntersectionObserver` whose `rootMargin` is `100% 0px` (a screen's height above and below); the first one inside starts the engine: the worker where `workerSupported()` (OffscreenCanvas, `transferControlToOffscreen`, and module workers, detected by the `type` getter that a browser knowing them reads before it rejects an unparsable URL, so no worker starts), else the in-page fallback, `import("./inline")`, which awaits `initBlueprint()` and plays the same names with `playCompiled` behind the same `RemotePlayer` shape. Then every iso canvas of the page mounts at once (a transfer and a message each; each loop still runs only while its canvas is on screen). Fields and images stay on the main thread, mounted at once as before. No `modulepreload` or `preload` was added: the worker fetches the module itself, a preload in the page would not reach the worker's request, and on the home page the hero is on screen anyway; measured below, the hero's first frame is no later than before.
7. **Small choices.** The device pixel ratio is not sent: the raster comes from the canvas's CSS size and the `pixelate` size, as before. The worker plays the 2D presenter only (`presenter: "webgl2"` and the accessible overlay are main-thread options; the site uses neither). A transferred canvas stays the worker's after `destroy`. When reduced motion is switched off while a canvas is on screen, the worker restarts its loop at once (`Loop.wake`); in the page, `run` restarts it on the next input, as before. `packages/blueprint/package.json` declares `"sideEffects": false`: without it the bundler kept the engine glue and the whole player in the page's chunk through the `dom` barrel (module-level constants count as side effects), although the page calls none of it.
8. **Test method.** Pixels of a canvas transferred to a worker cannot be read from the page (drawing the placeholder canvas gives transparent pixels in headless Chromium), and the package keeps no test-only message. The P4 harness attaches to the worker over CDP instead (`Target.setAutoAttach` with `waitForDebuggerOnStart`), and installs there, before the worker's script runs, what it installs in the page: the frozen `performance.now`, the seeded `Math.random`, the draw counter (`OffscreenCanvasRenderingContext2D.putImageData`), and a map of the transferred canvases by the id their `mount` message carries; the page side maps each element to that id by wrapping `transferControlToOffscreen` and `Worker.prototype.postMessage`. A canvas is hashed in the worker (drawn into a fresh `OffscreenCanvas`, `getImageData`), with the same hash as the page side, so the before capture compares as is; the clock moves in the page and the worker together. `remote.test.ts` runs `playInWorker` against `serveBlueprint` in one thread (jsdom, messages as tasks): the same pixels as `playCompiled`, the pointer and hover, the late subscriber's replay, `active`, an unknown swap ignored.
9. **Parity** (the P4 harness as in note 8, before on `3f63fecc`, after on this tree, both captured the same day on the same machine): `/`, `/pricing`, `/machine`, `/wild-erp` at 1440, 1024, 768 and 390, under reduced motion and at t = 1.7 and 4.3, the saga at the middle of each of its 14 steps (canvas, camera transform, captions, chapter), the develop track's 3 stops (canvas, stop lit), each legend row hovered, and again entered with the canvas in view: 632 + 60 comparisons, identical but for 17, and none of them on screen. Three are `/wild-erp` (`flat.ts`, untouched): a second capture of the old build differs from the first, and a second capture of each build gives the same 8 hashes. Fourteen are legend rows hovered once their canvas has scrolled off screen, in the narrow layouts (768 and 390: `stack6` rows 3–5, `resources` rows 5–8): the old page drew one more frame in the frame where the canvas left the screen (its loop's frame callback ran before the observer's notice), the worker gets the notice first and keeps the frame before; `resources`' lit row, which follows the drawn frames, then stays on 4 instead of 5 for rows the page cannot see the canvas of (both are stale: 5 was also wrong for rows 6–8). Both captures repeat exactly. With the canvas in view, all 60 hover cases are identical. No console error in the page or the worker before or after; nothing drawn off screen (0 draws in 2 s for every off-screen canvas, at the top and the middle of each page, counted in the worker).The in-page fallback, forced by removing `transferControlToOffscreen` in the harness (at 1440 and 390: reduced motion, t = 1.7, the saga, the track, the legend with the canvas in view): 232 comparisons, all identical, no console error, nothing drawn off screen.
10. **Perf** (headless, M4, load average about 40; main-thread task time per page frame over 4 s with the saga on screen, 1440 × 900; the worker's time is its frame callbacks and message handlers per worker frame): before → after, intro 2.7 → 0.47 ms, middle 3.6 → 0.47 ms, explosion 7.3 → 0.44 ms, fire 5.6 → 0.42 ms on the main thread (what is left is the page's own scripts and the saga's field shader); the worker spends 2.2, 2.9, 6.5 and 4.9 ms a frame, the engine's work moved off the page. The 4 ms target holds everywhere on the main thread.
11. **Time to the hero's first frame** (`erp-village`, first `putImageData` after navigation start, cache disabled, median of 8 loads, 7 under the 4G profile): local, 217 ms before, 204 ms after; 4G (60 ms latency, 9 Mbit/s), 977 ms before, 703 ms after. The page no longer waits for the engine to run its scripts, and the worker fetches the module while it downloads the scenes.
12. **Weight** of the home page (JS and WASM fetched, gzip −9, as in P4 note 13): JS 62.2 → 66.9 KB, WASM 57.2 → 57.2 KB, total 119.5 → 124.1 KB. What the page itself loads at start is 17.2 KB of JS (`canvas.ts` 5.5 KB with the nine metas, the field shader, the palette and filter helpers, the page scripts); before, all 62.2 KB loaded at start and the page scripts waited on the engine's compile (top-level await). The worker loads 49.7 KB (its entry, 9.0 KB: the engine's glue, the scene handles and the loop; the scenes, 40.8 KB) and the module, after the first iso canvas comes near the screen. The 4.6 KB more are what both sides need (filters, palette, the protocol) and the metas.
13. **Not done**: the WebGL2 presenter and the overlay in the worker; real browsers other than headless Chromium (Safari's and Firefox's worker `requestAnimationFrame`, module workers before Firefox 114 take the fallback). A worker that failed to load used to leave the iso canvases blank: note 14.
14. **No blank canvas** (19 November 2026, D-150). A canvas handed over with `transferControlToOffscreen` cannot come back, so two cases left it blank: a worker that fails, and a browser without WebAssembly SIMD (SIMD note 12). The smallest design that closes both:
    - **Probe before handing anything over.** `simdSupported()` (`dom/remote.ts`) validates a 31-byte module with one SIMD instruction (`i8x16.splat`, `i8x16.popcnt`); `canvas.ts` asks once at load. Without SIMD the engine cannot run anywhere (worker or page), so no worker starts, no canvas is transferred, nothing is logged: each iso canvas keeps what the page draws without it, its CSS box (so no layout shift) and the background of its container, and `isoCanvas` still returns a handle whose calls do nothing, so the page's scripts run unchanged. A poster image per scene at build (`stillPng`) was not taken: a build step and about 20 images for browsers from before March 2023. No second, scalar module either (SIMD note 12).
    - **A worker that fails falls back once.** `connectWorker(worker, { onFail, timeout })` calls `onFail(reason)` once, after terminating the worker, on an `error` event (the script did not load, or threw at start; the event is cancelled so the page does not report it again as its own), a `messageerror`, an `error` message with id −1 (the engine or the resolver's chunk did not start), or no `ready` (or `missing`) within `timeout` of the first mount (10 s; a slow but working worker is then replaced too, and the page fetches what the worker was fetching). Without `onFail`, errors are logged as before. `canvas.ts` reports the reason with one `console.error`, then replaces each canvas the worker held with `cloneNode(false)` (same attributes, so the same scoped styles and `id`), keeps the clone under the same handle (`isoCanvas(clone)` is the old handle), and plays it in the page (`inline.ts`), applying again the index and the vars the page set and the keys it listens to. Canvases not started yet wait for the in-page player. A failed `import("./inline")` (the network gone for the page too) is reported once more, and the canvases already handed over stay blank: the one case left.
    - **Listeners on the element.** A clone does not carry the page's listeners, so the home page's stack listens to `mousemove` and `mouseleave` on the box the canvas fills (`.stack-art`, same rectangle) instead of on the canvas. The other page scripts reach their canvas through `isoCanvas` only.
    - **Tests.** `dom/remote.test.ts`: `onFail` once on two `error` events and a `messageerror` (the first event cancelled, the worker terminated, nothing logged), on an id −1 error (a scene's own error is only logged), on a real `serveBlueprint` whose resolver rejects, on the timeout counted from the first mount (and not after a `ready`), off without `onFail`; `simdSupported` true in Node, false with `validate` mocked or without `WebAssembly`. `illustrations/canvas.test.ts` (jsdom, fake `Worker`, `inline.ts` mocked): one worker for every canvas; no SIMD, nothing started or transferred and nothing logged; no worker support, in the page; a worker `error`, one report, the clones in place with the same attributes and parent, played in the page under the same handle with the index and vars again; an id −1 error, the same.
    - **Browser check** (headless Chromium over CDP, the built site served by a test server, `/` at 1440 and 390, each iso canvas scrolled into view): (a) the worker's script answers 404: 21 of 21 canvases drawn in the page, one `console.error` (`the worker's script did not load`), no uncaught error; (b) the worker's script is `throw new Error(…)`: the same, the reason being the worker's message; (c) `WebAssembly.validate` returns false: 21 canvases never transferred and left as the page draws them, no error at all; the normal path: 21 in the worker, no error. The stack's hover picks its layer in every case. Parity with 19ed486b (the harness of note 8, 214 canvases on `/` at 1440 and 390: reduced motion, t = 1.7 and 4.3 s, the 14 saga steps, the track's stops, the legends): 214 identical, 0 console errors on both sides.
    - **Weight** of the home page (gzip −9, as in note 12): JS +0.5 KB (the probe, `onFail` and the restart in `canvas.ts`); the worker, the scenes and the module do not change.

## SIMD and size notes

Built on 19 November 2026, the owner's decision: a faster raster, a smaller module, exact parity. The module uses WebAssembly SIMD (`simd128`) in four hand-written kernels, the rest stays scalar, and the shipped module is smaller than before. Every golden suite, `library.test.ts` and `check-presenters` pass unchanged; the home page draws the same pixels.

1. **Where SIMD is enabled.** `scripts/blueprint/build-wasm.ts` adds `-Ctarget-feature=+simd128` to its own `RUSTFLAGS`, for the shipped and the test module; there is no `.cargo/config.toml`, so native tests and the native clippy stay scalar. The kernels are in `crates/fg-blueprint/raster/src/simd.rs`, compiled only under `cfg(all(target_arch = "wasm32", target_feature = "simd128"))`; each caller keeps its scalar loop, which handles what the kernel leaves (the tail of a row) and everything in a native build.
2. **The four kernels.** (a) `shade_row`, 16 pixels at a time: material and ink as bytes, the four tone vectors compared with the row's Bayer thresholds, and the lane masks narrowed to bytes; (b) `paint`, 16 slots into 64 bytes of RGBA through two `i8x16.swizzle` lookups in a 32-byte slot table (the scalar `paint` reads the same table, and both now write every byte rather than clearing the buffer first); (c) `write_run`, a face's run on one row written with splatted vector stores into the four buffers (the scalar `fill`s called `memory.fill` or looped, slow on short runs); (d) the inside test of a quad (`Quad::inside` in `fill.rs`), two edges a lane in `f64x2`.
3. **Why the bits do not move.** The kernels use integer lanes, float compares, and `f64x2` subtract and multiply in the scalar expression's order. WebAssembly SIMD has no fused multiply-add (only relaxed SIMD, which is not enabled), and nothing is reassociated. Shading compares tones in `f32`: a tone is already an `f32`, and the thresholds of sides 2, 4 and 8 (`(v + 0.5) / n²`) are exact in `f32`, so `t > θ` in `f32` gives the same answer as in `f64`. The kernel checks this per row and does nothing when a threshold is not exact. Auto-vectorisation is off (`-Cllvm-args=-vectorize-loops=false`, `-vectorize-slp=false`): it made the module 1.2 KB larger with no measured gain, and this way the only vector float code is the hand-written code.
4. **Tests.** Native unit tests cover the scalar side: the quad's hoisted test against `inside` on 20,000 generated quads (NaN, infinities, zeros, half-pixel grids), `paint` against the former code, and the merge sort against `sort_by`. The test module (feature `debug`) exports `simd_self_test`, which runs each kernel against its scalar reference (`shade_from`, `paint_from`, the four `fill`s) on 400 generated cases (lengths around 16, every material and slot, tones on, beside and between thresholds, NaN). `test/parity/simd.test.ts` expects 0 cases to differ. Changing one constant in the shading kernel makes 847 cases differ. The golden suites check the slots, and `check-presenters` checks the engine's RGBA against the WebGL2 presenter's own palette lookup in Chrome.
5. **Scalar wins along the way.** A plate's ring took `cos` and `sin` of the same 48 angles for every box, every frame, and V8-exact trig costs a software `fma` per term in WebAssembly (P3 note 1): 9.5 % of the village's frame. The 48 pairs are now computed once per frame buffer (`Frame::ring`) with the same functions. The quad's inside test computes the factors that do not depend on `x` once per row, the same operations on the same operands.
6. **What the module holds** (function bodies from the name section of a build kept with names; `twiggy` is not installed): the SceneBin reader (`load`) 20.7 KB, `emit_prim` 11.9, `Stage::draw` 8.8, `render::draw` 5.7, dlmalloc 7.2, the standard library's stable sort 6.0, `fill_convex` 4.3, `Animator::step` 3.9, the panic and `fmt` machinery about 4, and a data section of 17.8 KB (the face, the layout tables, messages).
7. **What was trimmed.** (a) The painter order sorts with `order::merge_sort` (natural runs merged two by two, about 500 bytes) instead of `sort_by` (6 KB): −5.1 KB. On a consistent comparator, every stable sort gives the order `sort_by` and `Array.prototype.sort` give. With a NaN depth the comparator is not consistent, and no sort matched V8 in that case before either. (b) No auto-vectorisation: −1.2 KB. (c) `wasm-opt --strip-producers --strip-target-features -Oz --converge`: −0.4 KB raw, −0.5 KB gzip. `codegen-units = 1`, `panic = "abort"` and LTO were already set, and wasm-bindgen's output has no name section, so `strip` changes nothing.
8. **Measured and not taken.** The z-buffer and the glow behind a cargo feature: −2.0 KB raw, −0.85 KB gzip. No site scene uses them (all 42 are `painter`, none glows), but they are part of the format, and the shipped module must read any valid `.bp`. A second "site" module is not worth that gain. The rigs are about 1.3 KB, also in the format. The panic machinery needs nightly's `panic_immediate_abort`, and the toolchain is pinned to stable. `wasm-opt -O3` is 3 KB larger and measured slower; `-Os` is 1.5 KB larger raw. Reading packed blocks per record instead of per word gave no measurable gain.
9. **Sizes** (shipped module, bytes, gzip −9 and brotli 11 by Node's zlib): 145,292 / 57,622 / 48,646 → 140,757 / 56,172 / 47,599 (141.9 → 137.5 KB raw; `build-wasm.ts` prints 55.9 → 54.5 KB gzip with Bun's zlib). The test module is 161,846 → 165,299 bytes (it adds the self-test).
10. **Perf.** The machine had a load average of 60 to 390 throughout, so the numbers are from interleaved runs of the two modules: 12 rounds in Node, the median of the p50s, with the minimum p10 in brackets. Immediate raster of `erp-village` at 720 × 450: 2.10 (1.07) → 1.02 (0.46) ms. `machine`: 2.47 (1.33) → 1.17 (0.59) ms. A card (`dashboard`, 212 × 139): 0.13 (0.073) → 0.041 (0.040) ms. The village's `play` frame on the script layer (its function, packing, raster, paint, present): 3.51 (1.77) → 1.98 (0.79) ms. The dashboard card's `play`: 0.22 (0.11) → 0.09 (0.057) ms. A single run of the perf suites, before → after p50: village immediate 1.64 → 1.17, `machine` 1.71 → 0.68, card 0.175 → 0.040, village `play` 2.19 → 1.24 ms (`target/bench/blueprint*.json`). Where the time went before: `fill_convex` 34 %, shading 26 %, software `fma` (the plate rings) 9.5 %. After: the span search, the strokes and decoding the packed blocks. In headless Chromium, worker time per frame with the saga on screen at 1440 (the harness's perf mode, median of 4 runs per module): intro 2.42 → 1.53 ms, middle 3.06 → 1.79 ms, explosion 7.27 → 7.47 ms (unchanged: there the village's own function is the frame, P4 note 12), fire 6.03 → 3.62 ms. Main-thread time stays 0.4 to 0.5 ms.
11. **Browser check.** The site was built twice (`astro build --outDir` to the scratchpad), once with the 0986112d module and once with this one. The JS glue is the same, so only the `.wasm` differs. The worker harness (`harness2.ts`, pixels read in the worker) found 214 of 214 canvases identical on the home page at 1440 and 390: reduced motion, t = 1.7 s and 4.3 s, the 14 saga steps, the line's stops and the legends. There were 0 console errors.
12. **No fallback module.** `simd128` is in Chrome 91, Firefox 89 and Safari 16.4 (March 2023), and every current browser has it. In an older browser the module would fail to compile; the page probes SIMD first and then leaves the iso canvases as it draws them, untransferred (Worker note 14). A fallback would cost a second committed module (about 139 KB, checked byte for byte too), a probe (`WebAssembly.validate` of a small SIMD module) in the loader and the worker, and a second set of parity runs. Not worth it for browsers this old; it can be added later as `wasm/scalar/` if needed.

## Village as data notes

Built on 19 November 2026 (the owner's decision): the home page's saga, `erp-village`, plays from data. Its function ran on the script layer in the worker, and at the explosion it was most of the frame (worker 7.47 ms a frame against about 1 ms of raster, SIMD note 10). Exact parity first; where the function's motion is history, a deterministic equivalent that looks the same in kind. Where the design was silent or did not hold, the smallest choice was made:

1. **What plays from data.** `library/erp-village.bp`, written by `scripts/blueprint/village.ts` (bun runs it under Node, for V8's constants, P1 note 2): one part per department of the function (`islands`, `wires`, `scenery`, `casino`, `customers`, `desks`, `marketing`, `shack`, `connectors`, `excel`, `upgrade`, `lockin`, `ai`, `erp`, `ruin`) instanced by the root in the function's drawing order, 915 prims; 861 `calc` and `blink` tracks that compute, every frame, what the function computes from `t` and the scroll (the step reveals, the swing, the slot machine's rounds and crank, the crane's slew, the counters, the reels, and so on); 13 conveyors for the pulses along wires and cables, 108 for the walkers; rigs for the procedural masses. The file also holds what `control/erp-village.bp` held (the `progress` var, the `story` machine, the camera's shots and fit box, unchanged), and that file is gone: `sources.ts` plays the village from data, `canvas.ts` reads its camera from `erp-village.bp?meta`. The page's integration (`set("progress")`, `on("state")`, the CSS camera, the captions) is untouched. The generator keeps the file's scene header and rewrites the rest; it is idempotent.
2. **`calc`, a track kind.** A `Num` is `b + k·p`, and most of the village is not affine: a clamp, a floor, a hash, a sine, a product of two values. A `calc` track computes a param from a number or a root param by operations applied left to right, each one float64 operation, operands numbers or root params (format.md §6). The generator writes each of the function's expressions as a chain in its own order (`clamp((p − a) / (b − a))` is `sub a, div (b − a), max 0, min 1`, with `b − a` the double JavaScript computes), so every value is the function's bit for bit; a param plus or minus a constant stays a `Num` (`x − 0.6` is `−0.6 + 1·x`, the same double). Comparisons and `and`, `or`, `not` give the flags (`visible`, `{ if }` inks); a `when` guard makes several calcs writing one param an `if` chain (the crane's six stretches, the crank). Its operations are a run of the key section (code, literal, root slot), so SceneBin's layout is unchanged; `calc` is evaluated in `tracks.rs`, unit-tested, and the TypeScript writer and schema know it.
3. **A conveyor's `phase`.** `(clock·speed + phase + k·L/count) mod L`: the connector cables' packets run at `(t·5 + i·3) mod L`; absent, a conveyor is as before. While writing the walkers it showed that `sceneDefs` never defined a part only a conveyor uses (it marked the part seen, then skipped it): fixed; no scene rode a conveyor before.
4. **Five rigs**, ports of `village.ts` operation for operation, as `smoke` and `sparks` are: `burst` (the 160 blast particles, from the blast's progress `b`), `mushroom` (the cloud: cap, dome, stem, collar, surge, 8,750 puffs, from `b`, `fire`, `t`), `pile` (the support's ticket pile, `round(160·g)` tickets), `fence` (the lock-in's posts and three barbed wires up to `done` units along the edge, open at the gate; as prims it was 1,950 line prims and 195 flags) and `ash` (the first `n` of 140 specks). The rest reuses `smoke`, `sparks`, `wheel` and `arm`. The cloud's puffs depend on their number for everything but `b`, `fire` and `t`: their hashes, sines, cosines and square roots are worked out once, on the first draw (about 9 ms, once), then a frame computes only the boil's sine of each puff drawn.
5. **Exactness** (`test/parity/village.test.ts`): at 1,768 cases (t at nine times and the frames of the animated suite's 60 fps sequence, × the progress every 1/80 and on each side of every step's ends), the engine's blocks equal the function's, word for word in painter's order (the raster's order: a conveyor's copies follow the root's blocks, which only matters at an equal painter's key), the walkers left out on both sides: the file's root param `crowd` set to 0, the function's walkers taken out by their box sizes west of the desks. 0 differ. One case shifted by a millisecond makes all differ.
6. **The one visible change: the walkers.** The function simulates them over the frames' history (a 30-second warm-up on the first frame, queues, walkers holding back for each other), which no function of `t` and the scroll gives. In the file each walker is on fixed loops: walker `w` lives in house `w mod 3` and every 30 s turns into the inbound lane at `30·w/18` s; per trip it goes to support when `hash(w, trip) < 0.15 + swing·0.75` (the function's rule; the function counts trips per walker, the file per 30 s), with `1 + floor(hash(w, trip + 1000)·3 + swing·2)` tickets; a trip is three conveyors, walking in (4.2 units/s, as the function), the line moving slowly up to the window (sales 0.6 units in 0.9 s, the function's service time; support 5.2 units in 8.2 s), walking home, each shown in its window of the period by a `blink` track (to a 60th of a second). Support's 8.2 s make both desks take as long from the corner of the inbound lane to where the return lanes meet, so that walkers sharing a lane keep their spacing on the way back, as the function's walkers keep their distance. Smaller differences: a walker turns a corner on the bisector of its two sides (the function's drawn position jumps by up to 0.57 units), follows the bridges' sag through three points per crossing (the function: every position), bobs its head while in line (the function: not at the window), no desk refuses a ninth walker (the function's `FULL`), and walkers are not drawn while at home or between trips, as in the function. As in the function, once the ERP has blown the walkers' bodies go and their parcels and tickets keep walking. Measured on the sheets below: 0.06 % to 0.30 % of the 720 × 450 raster's pixels differ, all of them walkers (`scratchpad/village-compare/`, before | after | mask, the 14 steps' middles at t = 0, 1.7, 4.3 and 9.2).
7. **Golden.** `erp-village` only (the other scenes' 2,384 cases unchanged): the 8 still `data` cases (the library file is now the whole scene, its still picture at the params' defaults, where it was the static part; the 8 `immediate` cases, the function's, are unchanged), and the 504 animated cases (the walkers, or their loads, are in every frame). The animated suite now plays a data scene that has `progress` over the progress sweep, at the frames of the 60 fps sequence for the village (the case names are the script layer's); the still suite checks the `flatten` fit only of scenes without rigs (`flatten` draws no rig; the animated suite checks the village's fit against the function's). `library.test.ts` leaves a file with rigs to `village.test.ts`; `samples.ts` adds the village to the site's `SCENES` (which no longer has it, so the worker no longer ships its function).
8. **Perf.** Headless Chromium, the harness's perf mode, two interleaved rounds of the build of `cae41fc5` and of this one, worker time per worker frame, 1440 × 900, M4 with a load average near 40: intro 1.55 / 1.44 → 1.23 / 1.26 ms, middle 2.03 / 1.84 → 1.55 / 1.51 ms, explosion 6.45 / 6.09 → 3.34 / 3.96 ms, fire 4.24 / 3.72 → 2.34 / 2.34 ms; main thread unchanged (0.4 ms). Node, `player.test.ts` (720 × 450, inputs to present): the explosion from data 7.98 ms p50 against 10.65 ms for the function on the script layer in the same run, before the cloud's table (the run's load was high); the table then took the cloud from about 4.8 ms to about 2 ms of a frame (3.7 against 7.4 ms whole, profiled by taking rigs out). What is left at the explosion is the cloud's thousands of dots (their blocks, sorting, raster); its per-frame sines are 0.5 ms of it. Tried and not kept: the cloud in the raster crate, which builds at `opt-level = 3` (+1.7 KB, no gain measurable on the loaded machine); `fg-blueprint` at `opt-level = 3` (the root `Cargo.toml` is outside this change's files).
9. **Sizes.** The module: 140,757 → 150,150 bytes raw (146.6 KB, budget 150 KB = 153,600 bytes), gzip −9 56,172 → 59,645 (budget 61,440: little room left; `build-wasm.ts` prints 57.7 KB), brotli 47,599 → 50,618, the debug module 165,299 → 174,709; rebuilt byte for byte. The compiled village is about 33 KB gzip; to get there, the compiled modules now write a field whose every value is an integer (indices, counts, codes) as differences from the record before (`vite.ts`, exact: safe integers add back exactly; −12 KB on the village, the other files slightly smaller), and a value only one part reads is written into that part's params rather than the root scope. The home page (gzip −9): the page's own `canvas.ts` chunk 5.5 → 7.3 KB (the village's meta: its root scope's 850 names), the worker's scenes chunk 40.6 → 61.2 KB (the village's data, less its function).
10. **Not done**: the queue does not hold walkers back (it moves at one speed); `production-line`, `resources` and `stack6` still draw from their function under a control file; a faster exact software `fma` for the trigonometry in WebAssembly (the sines that remain).

## P5 notes

Built on 19 November 2026: `packages/blueprint/src/canvas/` (`@forgeron/blueprint/canvas`: `kind.ts`, `scenes.ts`, `stage.ts`, `compositor.ts`, `layer.tsx`, `document.ts`, `viewer.tsx`, `review.tsx`, `viewer.css`, two suites), the rule `canvas-does-not-import-blueprint` with its self-test case, and the gallery page `/editors/blueprint` (`apps/ui-gallery/src/pages/editors/blueprint.astro`, `components/editors/Blueprint{Demo,Review}.tsx`, its sidebar and overview entries). The page shows any scene of the site's library in the four views. Where the design was silent or did not hold, the smallest choice was made:

1. **First its own package, `@forgeron/blueprint-canvas`; merged into `@forgeron/blueprint/canvas` on 20 November 2026, once the pixel face moved to `@forgeron/font` and `ui` no longer imported Blueprint (no cycle left).** At the time: §3 puts the integration under blueprint's `src/canvas/`. But `@forgeron/ui` depends on `@forgeron/blueprint` (the pixel face), and canvas depends on ui. So blueprint depending on canvas makes a cycle, `blueprint → canvas → ui → blueprint`, and moon refuses to build the project graph (`project_graph::would_cycle`). Moon counts peer and dev dependencies too. `@forgeron/blueprint-canvas` depends on `blueprint`, `canvas`, `ui` and `icons`, and nothing depends on it but the gallery. The rule covers both packages: `packages/canvas/` imports neither `packages/blueprint/` nor `packages/blueprint-canvas/`.
2. **The item kind** (`kind.ts`): `kind: "blueprint"`, `data: { file, scene, view, depth?, preview? }`. `file` is a key that the layer's `resolve(file)` turns into a read `Library`. `depth` overrides the scene's own depth mode (for the review). `preview: "part" | "assembly"` frames a part or an assembly alone, in a synthetic scene (`previewScene`: one instance, fill 0.8, unit `any`). `blueprintKind` has no resize handles, because a scene keeps the size it was framed at, and it moves like any other item. Its bounds are the CSS size the scene is framed in at zoom 1. The viewer uses the stage's own size, so a new scene opens at zoom 1 and fills the stage.
3. **A view switch is a load, not an encode.** `SceneCache` encodes a scene once per file, scene and preview kind (`encodeScene`, with fill 0.85 when the scene has none, since the site's converted scenes leave the fill to the page). It then writes the view and the depth into the two words of the scene record (`withView`: the last record before the string bytes, whose length is the strings' UTF-8). A test checks that the result equals `encodeScene` of the scene with that view and depth, byte for byte, for 4 views × 2 modes. On the village (Bun, M4 with a load average near 43), the first load with its encode takes 52 ms; a switch takes 3.0 / 9.0 ms p50 / p95 (load, resize, frame). The host's vars survive a switch, because the stage keeps them per item and sets them again.
4. **The layer** (`<BlueprintLayer stage>` in `layers.below`): the layer is inside the canvas's world transform. Its one `<canvas>` undoes that transform (`scale(1/z) translate(−x, −y)`), so its pixels are the surface's screen pixels. It subscribes to the canvas store imperatively, not through React state: items go to `stage.setItems`, the camera and the size to `stage.setViewport`. The pointer is read on the `.fg-canvas` root. The canvas package is unchanged.
5. **Zoom by steps** (`BlueprintStage`): each item is rasterised at the zoom step at or below the viewport's zoom (`DEFAULT_STEPS` 0.1, 0.25, 0.5, 0.75, 1, 1.5, 2), on a raster of `bounds × step / pixel` (pixel = `filters.pixel`, 2 by default). It is drawn at the integer scale `floor(pixel × zoom / step)`, centred on its bounds, at whole screen pixels. Crossing a step re-fits the scene (one `resize`). Between steps, and above 2, only the scale changes, so the picture's size follows the zoom in jumps rather than continuously. That is the price of crisp pixels. Pan only moves placements: the compositor draws again, and the engine is not called.
6. **One presenter for every item** (`compositor.ts`): WebGL2 when the browser gives a context. Each item's slots go up as an `R8UI` texture, one palette uniform from the canvas's CSS tokens, one scissored full-screen triangle per item. Otherwise the 2D canvas: the engine paints RGBA, one offscreen canvas per item, `drawImage` without smoothing. `dom/present-webgl2.ts` draws a single scene over the whole canvas, so it could not be reused; P5 does not touch `dom/`. The device pixel ratio is not used: one canvas pixel per CSS pixel, scaled by whole factors on a 2× screen. A `MutationObserver` on `data-theme` and `class` re-reads the palette.
7. **Clock and hover.** The stage owns the clock (play, pause, `seek`). `dt` is clamped to 0.25 s on a forward scrub and is 0 backwards. The engine runs only when the time, a var, the pointer or a load changed, and only for items on screen. An item skipped off screen is drawn when it comes back. Hover is a lookup in the last frame's tag buffer (`stage.hover`), not an engine call. A drawn pixel gives its tag, `""` when untagged; an empty pixel gives no hit. The pointer also goes to the engine (`scene.pointer`), so machines see `hover:<tag>` and `leave`. **No scene of the site's library has a tag**: their legends are the page's DOM. So hover shows "(untagged)" on them; it was checked on a tagged file.
8. **The viewer** (`<BlueprintViewer library initial frame? compositor? onStage?>`): a library list (a `Select`), a `FileInput` (pick or drop a file; a drop on the stage works too), and a `Tree` of scenes, assemblies and parts. The bar has the four views (`Segmented` 0°/90°/180°/270°) and the depth mode (file, painter, z-buffer). Below are the stage (`<Canvas>` with `ZoomControls`) and the transport: play/pause, a scrub `Slider` over the longest timeline on `t` (10 s when there is none), and a timeline `Select`. The inspector shows vars by type: `progress` as a slider, `int` as a slider with a "cycle"/"default" switch that releases it, `pointer` as the hovered tag, and `time` as the clock. It shows root params when there are 16 or fewer: `number` and `int` as sliders, `flag` as a switch (the village has 850, written by `calc` tracks). Then come each machine's state, the hovered tag, and a readout of refits, frames, draws and the last engine and draw times. Values are what the engine outputs after each frame, so cycles and machines' `set`s show. The item is replaced in a layout effect, so a view switch reaches the stage before the next paint. The reader (`readBlueprint`) runs in the page, because the viewer is a tool; the site still ships none of it.
9. **The library in the gallery** (`apps/ui-gallery/astro.config.ts`; replaced on 19 November 2026, note 14): a Vite plugin, `virtual:blueprint-library`, lists `apps/site/src/illustrations/library/*.bp` (the four `control/` files hold no prims and are left out). Each file is a lazy module of its text (`virtual:blueprint-library/<name>`), so the page fetches only what it opens (the village is a 605 KB chunk). The files are read as data at build time and never imported as modules, so no import goes from one app to another. Nothing is copied, and the gallery follows the site's files in dev too (`addWatchFile`). The clean end state is the library in a package (`@forgeron/blueprint-library`, already named in format.md §3); then only the plugin's `LIBRARY` path changes. That move touches the site's imports, which belonged to another change at the time. dependency-cruiser cannot resolve a virtual module, so `no-unresolved` now skips `^virtual:`.
10. **The z-buffer review** (`<DepthReview library>`, the page's section /02): for each library file, its first scene at t = 0, drawn at 240 × 150 raster pixels in painter's order, with the z-buffer, and as a third picture with the differing slots in the accent over the painter frame faded. It also gives the share of drawn pixels that differ, and a choice per scene (undecided, keep painter, z-buffer), kept in `localStorage` and copied out as JSON. Rows draw when they come near the screen. Shares at 360 × 225 (`scratchpad/p5/depth-review.md`): 0 % for `api`, `bars`, `blocks`, `cube`, `gate`, `module`, `network`, `pipeline`, `pipeline-labels`, `stack` (and `stack6`, which has no static prim); 0.3 to 3.5 % for most cards; `forge-cta` 5.6 %, `web` 5.4 %, `resources` 5.3 %, `hero-line` 6.3 %, `production-line` 6.9 %, and `hero-gateway` 25.9 %. The mechanical files hold only the static part of their scene, so the sheet judges that part. The village is the whole scene at t = 0 (1.3 %).
11. **Tests** (`packages/blueprint/src/canvas/*.test.ts`, jsdom, the engine started from the module file): `withView` against `encodeScene`; the 2D fallback and the placement; every tagged raster pixel found back under its screen pixel at zoom 0.5, 1 and 2, and no hit outside; re-fits (none over 50 pans and two zooms inside a step, one per step crossed, none above the last step, where the scale reaches 4); a view switch drawn by the next frame with a different picture; scrubbing (`t` = 1.7), a progress var driving the machine's state, which survives a view switch; a part or an assembly alone; the viewer loading its first library file (tree, title, machine state), the view and depth buttons, play and pause, the scrub by keyboard (End: 10 s, the engine's `t` and the readout), and a file that is not JSON. The fixture had to put its towers one layer up: in painter's order a plate's key (x + w + y + d) is larger than that of a short tower standing on it, and the plate covered the tower whole. That is what the review sheet is about. `engine-contract.ts` and the canvas suites are unchanged and pass (89 tests with the new ones).
12. **Headless Chromium** (chrome-headless-shell 1254 over CDP, SwiftShader, the gallery built to the scratchpad and served on a free port; M4 with a load average of 43; `scratchpad/p5/probe.ts`): no console error; WebGL2 compositor. Each of the four view switches on the village draws in the first animation frame after the click (counted by a rAF counter registered before it). The zoom buttons give one re-fit per step crossed (1, 1, 0 above 2, 0, 1, 1, 1). A 3 s wheel pan gives 0 re-fits and a compositor draw of 0.0 to 0.1 ms, with the engine untouched while paused and 1 to 2 ms a frame while playing. The pan ran at 25 fps paused and 22 fps playing, with idle `requestAnimationFrame` at 60 fps. The same pan on the plain `/editors/canvas` demo, with no Blueprint at all, ran at 20 fps in the same browser. So the 60 fps target was **not measurable here**: the canvas's own pan (React and SwiftShader compositing on a loaded machine) is the limit, and the layer adds under a millisecond. The hover on a tagged file found `tall`, `short` and `plate`. Screenshots: `scratchpad/p5/viewer-1440.png`, `viewer-1440-view90.png`, `viewer-1440-towers.png`, `viewer-390.png`, `viewer-390-full.png`, `review-1440.png`.
13. **Not done**: pinch and wheel zoom move the picture's size in steps (note 5), not continuously; the WebGL2 presenter's per-page cap (`MAX_WEBGL2`) does not count the layer's context; one picture per item even when it is mostly off screen (no tiling: a scene at zoom 2 is at most `bounds × 2 / pixel` raster pixels); the viewer shows one scene at a time (the layer takes many); the depth review judges t = 0 only; the library stays in `apps/site` (note 9); 60 fps pan not verified on a quiet machine with a real GPU.
14. **The library as a package** (19 November 2026): the `.bp` files moved (`git mv`) from `apps/site/src/illustrations/library/` to `packages/libraries/blueprints/` (`@forgeron/libraries`, the repository's shared assets, one folder per type), so the gallery no longer reads another app's files. A file is imported by its package path through `@forgeron/blueprint/vite` (`@forgeron/libraries/blueprints/erp-village.bp`, `?compiled`, `?meta`; the export `./blueprints/*` covers `control/`). `@forgeron/libraries/blueprints` exports `library`, the top-level files as lazy `?raw` modules (an `import.meta.glob`), which the gallery passes to the viewer and the depth review in place of its `virtual:blueprint-library` plugin (note 9). The scene functions, `samples.ts` and `library.test.ts` stay in the site (its script layer and the parity reference); the test lists the package's `blueprints/` and imports each file from the package. The scripts of `scripts/blueprint/` write to the package. The site's build is byte-identical to the one before the move.

## P6 notes

Built on 19 November 2026: `apps/blueprint` (`@forgeron/blueprint-site`), the site for `blueprint.forgeron.sh`, with Astro, one React island, and no new third-party dependency. It is not deployed. Where the design was silent, the smallest choice was made:

1. **Names.** The folder is `apps/blueprint`, as §4 says. Moon takes a project's id from its folder, and `packages/blueprint` is already `blueprint`, so `moon.yml` sets `id: "blueprint-site"`. The package is `@forgeron/blueprint-site`. Local port 5182; `.claude/launch.json` entry `blueprint`.
2. **Pages.** `/` explains the format in four cells. `host-servers.bp` plays live (`?compiled` through `@forgeron/blueprint/vite`, `playCompiled`, 2D presenter, palette from the page's CSS). Next to it is a whole example file (`src/lib/example.ts`, a part, an assembly, a scene with a `spin` and a `blink`) and its picture, drawn at build time. `/format` is `docs/blueprint/format.md` itself, through Astro's own Markdown (`compiledContent()`, `getHeadings()` for the table of contents). Its relative links to `engine.md` are rewritten to the document on GitHub. `/library` is the part library. `/viewer` is `<BlueprintViewer>` on `@forgeron/libraries/blueprints`, and `?file=` opens a file. `/schema/v1.json` is `formatJson(SCHEMA)`; a test checks it equals the checked-in `blueprint.v1.json`. A `public/_headers` file serves it with `Access-Control-Allow-Origin: *` and `application/schema+json`. There is also a `404` page.
3. **Astro 7's Markdown.** Its default processor (Sätteri) does not run rehype plugins: a `rehypePlugins` entry fails the build unless `@astrojs/markdown-remark` is installed. The link rewrite is therefore a function on the compiled HTML (`src/lib/doc-links.ts`), not a plugin. Code blocks have no syntax colours (`syntaxHighlight: false`), as in the rest of the lab.
4. **Pictures at build time** (`src/lib/parts.ts`). Each part and assembly is framed alone in a synthetic scene, as the viewer's `previewScene` does (fill 0.8, unit `any`). It is drawn by the engine (`createScene`, `frame(0)`, `snapshot`) at 180 × 120 raster pixels (pixel 2, Bayer 4), then written with `toSvg`, so its colours are `var(--token, fallback)`. In a bundled Astro build, `@forgeron/blueprint`'s own start-up cannot find its module file (it looks for `/src/engine/` in `import.meta.url`), so the page starts the engine itself: `initBlueprintSync` on `wasm/fg_blueprint_bg.wasm`, found through `createRequire().resolve("@forgeron/blueprint")`.
5. **Parts whose defaults draw nothing.** Seven of the village's parts draw nothing at their defaults. Most take their sizes from `calc` tracks (all their params default to 0); the walkers are gated by flags off by default. Such a part is drawn first with every flag on, which covers `walker` and `walker-window`. Failing that, it is drawn as it stands in its file's scene, with every other root instance hidden and other conveyors removed. The scene's own framing finds the progress (21 steps) and time (0, 1.7, 4.3 s) where the part draws the most, and a second pass frames the part at that moment (`fit.at`, no `fit.box`). A part used only inside an assembly is drawn through that assembly. Each such card says where its picture comes from. The one part with no prims, `stack6.bp/static`, shows a note instead: the site's script layer draws it. Village parts are framed on their whole extent in the village, so some (`customers`, `desks`, `connectors`) are small drawings with labels at the edges, and `pulse1`/`pulse2` are one dot each.
6. **Tests.** `src/lib/parts.test.ts` checks that every part and assembly draws a non-empty SVG (60 of 61; the exception is listed by name), and the library page calls `assertDrawn`, so a blank part fails the build. `example.test.ts` checks that the example is valid (`schemaErrors`, `readBlueprint`) and draws in the accent. `schema.test.ts` checks the served schema. `doc-links.test.ts` checks the link rewrite. `scripts/check-links.ts` (moon task `links`, after `build`) checks the built `dist/`: 5 pages, about 130 internal `href`/`src`, every anchor, and the schema's `$id`. External links are listed, not fetched. A headless Chromium pass (chrome-headless-shell 1254 over CDP, `dist/` served as Workers assets resolve it; `scratchpad/p6/probe.ts`) covers the five pages, `?file=`, the schema and a 404 at 1440 and 390. It found no console error or exception. The live canvas drew (33,365 pixels unlike the background at 1440), 60 cards had a drawn SVG, and the search, kind and file filters gave 1, 2 and 20 cards.
7. **Weight.** The library page is 1.6 MB of HTML (330 KB gzipped): 61 inline SVGs of dithered runs. `content-visibility: auto` on the cards keeps the off-screen ones from being laid out. The viewer page loads each library file as its own chunk when opened (the village is 620 KB), as in the gallery.
8. **Release.** The site is wired like `font` and `ui-gallery`: `wrangler.jsonc` names the Worker `forgeron-blueprint`, serves `dist/` as static assets and sets the custom domain `blueprint.forgeron.sh`. No deploy command was run and no DNS was set. The repository's release path (`release.yml` → `deploy.yml` → `bun run deploy:<env>`, which filters workspace packages by a `deploy:<env>` script) holds no such script for any site, `font` and `ui-gallery` included. So the sites go out by whatever builds them from their `wrangler.jsonc` outside this repository, and `apps/blueprint` goes out the same way.
9. **Not done**: the scene composer and the timeline editor on canvas (§4, "Later"); a light theme toggle (the SVGs and the viewer would follow the tokens); opening a given part or scene in the viewer from a card (the viewer's `initial` takes a file, not a target); a real deployment.
