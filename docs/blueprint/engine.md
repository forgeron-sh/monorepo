# Blueprint engine: the scene system, its format and its Rust core

> Status: design, not built (18 November 2026). Builds on D-148 and on the benchmark in [`../benchmarks/canvas-engine.md`](../benchmarks/canvas-engine.md). The owner's decisions it applies are in the handoff ([`../handoff/2026-11-18-ui-canvas-blueprint.md`](../handoff/2026-11-18-ui-canvas-blueprint.md), "Performance", "Blueprint rebuild"). To be recorded as D-150 when phase 1 lands.

Blueprint becomes a small, specialised scene engine: Parts and Assemblies described as JSON, Scenes with an iso camera, Timelines and state machines, compiled and rasterised by a Rust core in WebAssembly, presented by a thin TypeScript layer. The same core runs at build time for the static SVG and PNG. Nothing switches on the site before every scene renders identically from the new engine.

**Fixed by the owner** (not reopened here): isometric pixel style, orthographic, four quarter-turn views, no free 3D camera; a TypeScript WebGL2 presenter fed by buffers in WASM shared memory; no wgpu; one boundary call per frame; a WASM budget of 150–300 KB; the canvas editor engine stays TypeScript for now.

## 1. What exists today

### Code

| Where                                   | Lines | What it is                                                                                                                                       |
| --------------------------------------- | ----: | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `packages/blueprint/src/core/`          | 1,550 | blocks, iso 2:1 projection and fit, rasteriser into a frame of materials, filters, palette, SVG, the bitmap face (`font.ts`), field GLSL as data |
| `packages/blueprint/src/dom/`, `react/` |   640 | `mount` (observers, loop, cycle, reduced motion), `mountField` (WebGL fields), `mountImage`, `<Blueprint>` with marker components                |
| `apps/site/src/illustrations/` iso      | 5,555 | `objects.ts` 2,142 · `village.ts` 1,666 · `scenes.ts` 1,165 · `machine.ts` 347 · `parts.ts` 235                                                  |
| `apps/site/src/illustrations/` cells    |   880 | `flat.ts` 583 (the /wild-erp scene) · `hearth.ts` 297 (the footer)                                                                               |
| `apps/site/src/illustrations/canvas.ts` |   155 | `canvas[data-iso]` options parsed from `data-*`, the `isoCanvas(el)` handle (`select`, `show`, `onActive`)                                       |

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

One JSON file holds a library of Parts, Assemblies and Scenes. Files end in `.bp.json`. The schema is published at `packages/blueprint/schema/blueprint.v1.json` (generated from the TypeScript types below) and served by `blueprint.forgeron.sh/schema/v1.json`.

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
  /** A path relative to this file, or a package path ("@forgeron/blueprint-library/office.bp.json"). */
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

1. **Mechanical** (`packages/blueprint/src/format/convert.ts`, run by `scripts/blueprint/convert-site.ts`): run each scene function at many sampled `t`, `active` and progress values; blocks that never change become prims of a flat part, with the **exact** float64 values the code produced; blocks that change are reported per scene (which helper produced them, how they vary). Output: `apps/site/src/illustrations/library/<scene>.bp.json` and a report.
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

`@forgeron/blueprint` keeps its public API: `render`, `renderSvg`, `toSvg`, the block helpers, the filters, `mount`, `<Blueprint>`. They accept a `SceneSource` as today (block lists and functions of `{ t, active }` go through immediate mode) **or** a scene from a `.bp.json` file. The one break: the engine is asynchronous to start, so callers `await initBlueprint()` once (a module script can use top-level await; an Astro frontmatter can too). New subpaths:

| Subpath                      | Contents                                                                                                                                                                                    |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@forgeron/blueprint/format` | types, `readBlueprint(json, { load })` (validate + resolve imports), `writeSceneBin`, the converter                                                                                         |
| `@forgeron/blueprint/engine` | `initBlueprint(source?)` (a URL, bytes or a `WebAssembly.Module`: Workers forbid compiling from bytes), `createScene(doc, name)` → `{ resize, set, emit, frame, on, slots, tags, dispose }` |
| `@forgeron/blueprint/dom`    | `mount` on the engine; `play(canvas, scene, options)` with `set("progress", p)`, `set("active", n)`, `release("active")`, `emit("hover:…")`, `on("active", fn)`; presenters                 |
| `@forgeron/blueprint/build`  | `stillSvg`, `stillPng`, `spriteSheet(scene, { fps, frames })` → PNG atlas + JSON manifest                                                                                                   |
| `@forgeron/blueprint/canvas` | phase 5: `blueprintKind`, `<BlueprintLayer>`                                                                                                                                                |

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
- `scripts/blueprint/convert-site.ts`: the mechanical pass over every scene of `SCENES`; writes `apps/site/src/illustrations/library/*.bp.json` and `target/blueprint/convert-report.md` (static vs varying blocks per scene, by helper).
- **Tests**: schema accepts §2's example and rejects 12 malformed files with the path in the message; import resolution (cycle, missing name, prefix clash); round trip `read(write(doc))`; for every scene and sample, `flatten(converted)` equals the static blocks of the original **as values** (`toStrictEqual`, float64 exact), and the TS renderer draws the same frame from both.
- **Done**: 42 scenes converted for their static part; the report says what each one still needs in P3.

### P2: Rust core and rasteriser, parity on still frames

- Toolchain in CI and moon: `rust-toolchain.toml` (exists), a moon project `crates` with tasks `test` (`cargo test`), `clippy`, `wasm` (`scripts/blueprint/build-wasm.ts`, following `packages/canvas/bench/build-wasm.ts`); `.prototools` notes rustup.
- `crates/fg-math/src/{lib,vec,iso,num}.rs`; `crates/fg-blueprint/src/{lib,layout,bin,scene,cull,order,raster/{frame,fill,line,dot},boxes,labels,font,shade,immediate,paint,wasm}.rs`. `font.rs` is generated from `core/font.ts` (`scripts/blueprint/gen-font.ts`, checked in sync by a test).
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
- The viewer: open a `.bp.json`; list parts, assemblies, scenes; four view buttons; play, pause and scrub a timeline; set vars; hover shows the tag. Chrome from `@forgeron/ui`.
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
5. **Names.** _Recommended_: `blueprint.forgeron.sh` (singular, the product's name), files `*.bp.json`, the schema URL `https://blueprint.forgeron.sh/schema/v1.json`.

## P1 notes

Built on 18 November 2026: `packages/blueprint/src/format/` (`types`, `schema`, `validate`, `read`, `flatten`, `write`, `convert`), exported as `@forgeron/blueprint/format`; `packages/blueprint/schema/blueprint.v1.json`; [`format.md`](format.md); `scripts/blueprint/{gen-schema,convert-site}.ts`; `apps/site/src/illustrations/library/` (42 `.bp.json`, `samples.ts`, `library.test.ts`). Where the design was silent or did not hold, the smallest choice was made:

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
