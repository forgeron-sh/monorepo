# Handoff — UI library, editors, Rust engines (2026-11-18)

Written at the end of a long session so the next one can carry on. The owner speaks French; reply in French.
Read with: `packages/ui/README.md`, `apps/ui-gallery/README.md`, `docs/design-taste.md`, `docs/DECISIONS.md` (D-147, then D-148 when it lands), `CLAUDE.md`.

## 1. Where things stand

Branch `chore/site-forgeron-sh`, pushed to origin at `c6226256`. Commits of this session:

- `89a305ab` docs(prototypes): the HTML prototypes of the apps (`docs/prototypes/*.html`, built from `~/Developer/Profesional/forgeron-prototypes`) and the social banner kit.
- `f6168204` feat(ui): `@forgeron/ui` atoms, Base UI overlays (D-147), pickers + glyphs, blocks (lists, filtering, record, navigation, data, views), hooks, shaders, `--scrim` token.
- `716c938d` feat(ui-gallery): `apps/ui-gallery` (ui.forgeron.sh, port 5181, launch config `ui-gallery`).
- `c6226256` feat(site): the Pick / Shape / Ship home page and pricing (another session's work, committed on the owner's request).

**Uncommitted, finished and verified:** the icon picker (`packages/ui/src/blocks/icon-picker*`, `apps/ui-gallery/src/entries/icon-picker.ts`, `examples/icon-picker/`, one line each in `blocks.css`, `index.ts`, `registry.ts`). It shares those three files with the agents below. Commit it with their work, in separate commits.

**Pushing:**

- The pre-push hook runs `bun run check` on the working tree. Inside the hook, `bun` resolves to an old 1.3.x (Homebrew or `~/.bun`) instead of the pinned 1.4.3, and that version cannot read `bun.lock` v2. Push with `PATH="$HOME/.proto/shims:$HOME/.proto/bin:$PATH" git push`.
- When agents are still writing files, push from a clean worktree of HEAD (`git worktree add --detach <tmp> HEAD`, `bun install`, push from there, then remove the worktree).

## 2. Agents launched and still running

All of them are Opus subagents of the previous session, working in this checkout, each with its own files. Their reports went to the previous session, so **check their files, not reports**. Each was told to run, before finishing: tsc, oxlint, oxfmt, vitest on its files, astro check, and some of them astro build and deps.

| Work                                                                       | Files it owns                                                                                                                                                                                                                                         | Done when                                                                                                                          |
| -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **@forgeron/canvas** (headless engine + React + gallery "Editors" section) | `packages/canvas/**`, `docs/ARCHITECTURE.md`, `docs/DECISIONS.md` (D-148), `.dependency-cruiser.cjs` (new rules), `knip.json`, `apps/ui-gallery/src/pages/editors/**`, Nav/Sidebar/Layout additions                                                   | package builds, tests pass, `/editors/canvas` live                                                                                 |
| **Landing on @forgeron/ui, no regression**                                 | `apps/site/**`, `packages/ui/src/blocks/marketing*`, new atom files in `packages/ui/src/` (+ an appended `/* Marketing atoms */` block in `atoms.css`, export lines in `index.ts`), `entries/marketing.ts`, end of the `atoms` array in `registry.ts` | before/after screenshots under `/private/tmp/claude-501/site-shots/` match at 1440/1024/768/390                                    |
| **Data hub blocks**                                                        | `packages/ui/src/blocks/datahub*`, `entries/datahub.ts`, its examples                                                                                                                                                                                 | field type picker, field editor, record grid, record form, relation picker, import wizard… (the schema diagram is left for canvas) |
| **Drive blocks**                                                           | `packages/ui/src/blocks/drive*`, `entries/drive.ts`, its examples                                                                                                                                                                                     | folder tree, file browser, drop zone + upload queue, preview, share dialog, details, move dialog, storage meter                    |
| **Automation blocks** (from Flows, not the node editor)                    | `packages/ui/src/blocks/automation*`, `entries/automation.ts`, its examples                                                                                                                                                                           | trigger picker, step card, linear step list, inspector, variable picker, condition builder, schedule editor, run history           |

**Data hub: done (2026-11-18, not committed).**

- 9 blocks:
  - `RecordGrid`: an editable sheet, with keys like a spreadsheet;
  - `RecordForm`;
  - `FieldTypePicker`: 13 types, each with its SQLite storage;
  - `FieldEditor`;
  - `SchemaFields`: reorder by drag or Alt+arrows;
  - `RelationPicker`;
  - `ColumnMapping`;
  - `ImportWizard`: file, then columns, then check, then import;
  - `TableList`.
- `FieldInput` and `datahub-model.ts` are shared: parse, validate, format, `parseCsv`.
- 18 tests pass.
- Still to do: add a Data hub row to `packages/ui/README.md`.
- Not built: grid virtualisation, column resize, file upload.
- **What the schema diagram needs from canvas:**
  - nodes are table cards that reuse `FieldTypeGlyph`, `ConstraintChip` and `DataField`;
  - edges go from a field row to the target table's primary key, in three styles: same-database foreign key solid, cross-app bridge dashed, Odoo sync a third style;
  - orthogonal routing in lanes, as the prototype's `schemaWires` and `wirePath` do;
  - draggable nodes whose positions are saved;
  - a click on a card opens the table, a click on an edge highlights both ends;
  - a legend, and a text list of the relations as the accessible alternative.

**Automations: done (2026-11-18, not committed).**

- 13 entries:
  - `AutomationList` and `RunBars`;
  - `StepCard`, with `layout` set to `row` or `node`;
  - `StepPicker`;
  - `StepList`, with branches and pure helpers;
  - `StepInspector`, `StepFields` and `StepSettings`;
  - `ExpressionInput`, which inserts `{{ step.field }}` chips;
  - `ConditionBuilder`;
  - `ScheduleEditor` (cron, a sentence summary, next runs);
  - `RunList`;
  - `RunDetail`, with a waterfall view;
  - `JsonView`;
  - `PublishBar`, `PublishDialog` and `ChangeList`;
  - `VersionHistory`.
- The shared model is `automation-model.ts`. 20 tests pass.
- **What the future `@forgeron/flow` editor reuses:**
  - `StepCard layout="node"` as the body of a node;
  - `StepPicker` as the "Add a block" panel;
  - `StepInspector` as the side panel;
  - `ConditionBuilder` and `ScheduleEditor` as the bodies of the If and Schedule nodes;
  - the run, publish and version blocks in the editor's header and tabs.
- Suggested: make `SelectMenu`'s 180px `min-width` a prop or a token, and add an automation row to the README.
- At the end of the run, `astro check` showed 6 errors in `apps/ui-gallery/src/components/editors/CanvasDemo.tsx`. That file belongs to the canvas agent.

**Drive: done (2026-11-18, not committed).**

- 11 entries, 26 tests:
  - `FileBrowser`: list or grid; selection by click, ⇧/⌘, lasso and keyboard; rename with F2; drag to move; drop files from the computer; `menu(ids)` + `onAction` for the context menu;
  - `FolderTree`: the ARIA tree pattern, lazy children, drop targets;
  - `SelectionBar`: takes the same `Action[]` as `useActions`;
  - `DropZone`;
  - `UploadQueue`;
  - `StorageMeter`;
  - `FilePreview`;
  - `FileDetails` and `VersionList`;
  - `SharePanel` and `ShareDialog`;
  - `MovePanel` and `MoveDialog`;
  - `FileTypeMark`, plus helpers.
- **Small backward-compatible changes it suggests to existing pieces:**
  1. `Dialog` closes when Escape is pressed inside a portaled popup. It should ignore keydown events whose target is outside its box (`ShareDialog` works around this with `PortalEscape`).
  2. `SelectMenu` needs a `width` or `fluid` prop instead of the hard-coded 180px minimum, which both Drive and automations override.
  3. `Progress` needs a `hideLabel` or `compact` prop, so the new `BlockBar` can merge back into it.
  4. `formatShortcut` should write function keys in upper case ("F2").
  5. `ContextMenu` should take a controlled `open`.
- `astro check` still showed 6 errors in the canvas agent's `CanvasDemo.tsx`.

**Canvas: done (2026-11-18, not committed). 72 tests, deps self-test OK, gallery `/editors` and `/editors/canvas`.**

- **The interface the Rust engine will take over:**
  - `CanvasEngine`: `dispatch(command)`, `query(q)`, `getState()`, `subscribe`, `serialize()` and `load()` (JSON with `version: 1`);
  - `createTsEngine(options)` is the reference engine; `withCommands(engine)` turns any engine into a store with named commands.
- **Contract tests:** `packages/canvas/src/core/engine-contract.ts` holds 14 behaviour tests that only use the interface. A WASM engine must pass them unchanged.
- **Renderer:** `CanvasRenderer` exposes `mount`, `render(scene)` and `unmount`. A `Scene` is plain data; the default renderer is DOM. This is where the WebGL2 renderer of the Rust buffers will plug in.
- **Extension points for flow and draw:**
  - kinds (hit test, resize rules, movable…);
  - `layers.below/above` and `<WorldSvg>` for edges;
  - the connect gesture through `data-canvas-handle`, with `onConnect` and `canConnect`;
  - tools as `{id, down → {move, up, cancel}}`.
- **Dependency rules added:** `ui-does-not-import-editors`, `canvas-does-not-import-its-editors`, `canvas-core-is-framework-free`, `canvas-core-stays-neutral`, each with a case in `scripts/deps-selftest.ts`.
- **D-148** is written, with the benchmark criteria and flow/draw on hold.
- **Not yet in the TS engine:**
  - a spatial index (queries scan every item);
  - group resize;
  - multi-touch pinch;
  - the system clipboard.
- **Calls to revisit:**
  - the wheel pans by default (`wheel="zoom"` for the flows behaviour);
  - the lasso selects by item centre.
- **Needed in `@forgeron/ui`:**
  - `matchShortcut` cannot bind `+`;
  - `useShortcuts` ignores repeated keys, and skips `[role=listbox]`;
  - one control-height token, since `IconButton` is 32px and `Segmented` 30px.
- **Hydration errors seen in the gallery console:** `BriefcaseIcon` and `Sparkles01Icon` come from another agent's examples, probably landing or an icon not drawn. Find and fix them.

**Landing: done (2026-11-18, not committed).** `apps/site` is built from `@forgeron/ui`.

- Screenshot comparison (exact RGB, JS on and off, canvases hidden): home, pricing, `/machine` and `/wild-erp` are identical at 1440/1024/768/390 and seven extra widths. `/design-system/architecture` differs under 700px only: the layout now loads `styles.css` once, so the diagram's container query hides the "Show as a list" toggle as designed (before, a second `atoms.css` import overrode it).
- New atoms: `SectionHead` (+ `titleLines`), `SectionBand`, `PixelFigure`, `SoonTag`, `MarkBadge`, `LogoTile`, `Stepper`, utilities `fg-rail`, `fg-ticks`, `fg-dots`.
- Marketing blocks: `SiteNav`, `Hero` (`command` accepts an element), `LogoStrip`, `StoryList`/`StoryStep`, `Bento`/`BentoCell`, `CardGrid`/`ArtCard`, `FigureGrid`, `PlanGrid`/`PlanCard`, `CompareTable`, `Faq`, `CtaBand`, `SiteFooter`. 9 tests.
- Stays in the site: the opening saga, the iso legends, the step mocks, the pricing simulator and tables, the dissolve band, the globe, `Footer.astro` (glue + hearth script).
- Deleted from the site: `SectionHead.astro`, `SiteNav.astro`, `Stepper.astro`, `ToolLogo.astro`.
- **Owner decision pending:** the pricing FAQ keeps two old quirks through a `faq-plain` override (ink open mark, number column collapsing under 760px). Dropping it aligns with the home FAQ.
- Screenshots: `/private/tmp/claude-501/site-shots/{before,after,extra-before,extra-after,diff}`.

The barrels (`blocks/<group>.ts`), CSS files and gallery entries files were pre-wired: they are already exported from `packages/ui/src/index.ts`, imported in `blocks.css` and spread in `registry.ts` `blocks`.

**The canvas agent received a late adjustment.** Its core must sit behind a `CanvasEngine` interface (pure data and commands) with a separate `Renderer` interface, so a Rust/WASM engine can replace it. Its tests target the interface, and D-148 records that the core is meant to move to Rust after a benchmark. **flow and draw are on hold** until that decision.

### To do when they finish

1. Read their files and diffs; check that each group's barrel exports what the gallery entries document.
2. Run, one at a time:
   - `cd packages/ui && bunx tsc --noEmit -p .`;
   - `bunx oxlint packages apps/ui-gallery apps/site`;
   - `bunx oxfmt --check …`;
   - `bunx vitest run packages/ui packages/canvas`;
   - in `apps/ui-gallery`: `bunx astro check && bunx astro build --outDir <tmp>`;
   - in `apps/site`: the same;
   - `bun run knip`;
   - `bun run deps`.
3. Restart the gallery dev server (preview `ui-gallery`). The eager example glob is fixed at start, and another session keeps regenerating `packages/icons`, so transient "Could not import ../drawn/…" errors come from that, not from the gallery.
4. Look at `/blocks`, each new block page and `/editors/canvas` in the browser.
5. Commit by group (icon picker, datahub, drive, automation, marketing + site, canvas + D-148), Conventional Commits, no co-author line, then push as described in section 1.
6. Update `packages/ui/README.md` (block tables) and `apps/ui-gallery/README.md`.

### Follow-ups the agents and the owner raised

- **Icon picker:** add `./chunks/*` (per-letter files) and `./search-index` exports to `@forgeron/icons`. The lazy chunk is about 166 KB gzipped today, and the picker could use real categories. Do this only once the icons session is done.
- **Tones:** whether the icon picker keeps its tone option.
- **Light theme:** black on `--accent` measures 3.86:1, under 4.5. Choose a lighter light-theme accent or another `accent-ink`.
- **ViewHeader:** the current tab still shows a count. Keep it or not.
- **PriorityPicker:** has no `levels` prop.
- **Timeline and Calendar:** no colour by default; calendar drag uses native drag and drop, which does nothing on touch and was not confirmed by hand.
- **Shaders:** apps still use their own copies of the dither field (font, icon-gallery, ui-gallery Layout) instead of `@forgeron/ui`. The canvas and WebGL glue exists twice, in `blueprint/dom` and `ui/shaders`; the new `@forgeron/shaders` package below fixes this.

## 3. Decisions taken with the owner

### Editors are separate packages (approved)

| Package            | Content                                                                                                                                                 |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@forgeron/canvas` | The shared engine: infinite surface, pan and zoom, coordinates, pixel grid and snapping, hit testing, lasso, history, serialisation, minimap, shortcuts |
| `@forgeron/flow`   | Node graph: typed ports, edges, auto-layout, run state. Used by Flows and the console automations                                                       |
| `@forgeron/draw`   | Whiteboard: shapes, stickies, pixel pen, text, arrows, frames. Used by Board                                                                            |

- The Data hub schema diagram is also built on canvas.
- Chrome comes from `@forgeron/ui` (toolbars, zoom controls, palettes, inspectors, menus). ui never imports canvas, flow or draw.
- The gallery has an "Editors" section for them.

### Performance: Rust where it pays, the GPU for drawing (approved)

**The architecture:**

```text
crates/  (Rust workspace)
  fg-math          vectors, transforms, iso projection, quarter turns
  fg-canvas-core   document, spatial index, hit test, selection, snapping,
                   history, culling, building GPU vertex buffers
  fg-blueprint     format, compiler, low-res iso rasteriser with a depth buffer
  fg-shaders       CPU passes: error diffusion (Floyd–Steinberg), palette quantisation
        │ WASM (wasm-bindgen), shared memory, one call per frame
        ▼
packages/
  @forgeron/canvas     TS API + small WebGL2 renderer of the Rust buffers
                       + DOM overlay (text editing, forms, a11y tree) + React
  @forgeron/shaders    GLSL passes run in the same WebGL2 renderer (post-processing)
  @forgeron/blueprint  same TS API as today, core moved to Rust, plus a canvas layer
  @forgeron/flow, @forgeron/draw   item kinds and tools on canvas
```

**Rules:**

- **Drawing is the GPU's job.** WebGL2 now, WebGPU later. Rust/WASM does the heavy CPU work: compiling, depth-sorted rasterising, the spatial index and hit testing on tens of thousands of items, culling, buffer building, auto-layout, history, CPU shader passes.
- **The engine lives in WASM and keeps its state** (the Figma model). Buffers go through shared memory to WebGL2. Never cross the JS/WASM boundary per item or per frame several times.
- **No wgpu.** It adds 1–2 MB of WASM, and our primitives are simple: rectangles, lines, pixel sprites, grid, post passes. Target 150–300 KB of WASM.
- **Text editing, forms and accessibility stay in DOM.** A canvas is invisible to screen readers, so the overlay keeps a parallel accessible tree.
- **The same Rust core runs at build time** (Node, Workers) to output the site's static SVG and PNG.
- **Costs:** the Rust toolchain in `.prototools` and moon, `wasm-pack` in CI, a 10–50 ms WASM start, harder debugging.

### `@forgeron/shaders` (approved direction)

- Consolidate the effects from `@forgeron/blueprint` (field, Bayer, image) and `@forgeron/ui/src/shaders`. ui keeps thin React wrappers that import the package.
- **A pipeline of passes:** a source (field, image, scene, text) goes through passes (pixelate, dither Bayer / blue noise / Floyd–Steinberg, palette, glow, scanlines, halftone, edges, CRT) to an output (live WebGL2 canvas, or static PNG/SVG at build).
- Each pass has a GLSL version and a CPU version; the CPU ones move to Rust when measurements justify it.
- Settings are saved as JSON presets, shared by the editor, the site and code.
- The editor is a stack of passes with live parameters, exporting the preset and the code.

### Blueprint rebuild (approved direction)

**Today:**

- The core is about 2,200 lines of TS: blocks (box, line, dot, label) → iso scene → low-res raster → filters → SVG or canvas.
- The real content is about 6,700 lines of code in `apps/site/src/illustrations/` (`objects.ts`, `village.ts`, `machine.ts`, `scenes.ts`, `parts.ts`).
- Depth is fixed by hand with `raise` and `lift` layers, and animation is a function of `t`.

**Target: a light, specialised scene engine**, "like a video game engine but light". The format is JSON with a versioned schema, writable by editors:

| Notion       | Meaning                                                                                                                                       |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Part**     | A named object, the OBJ equivalent: boxes, lines, dots and labels, with sockets (anchor points)                                               |
| **Assembly** | Instances of Parts placed by quarter turns, snapped by sockets, nestable                                                                      |
| **Scene**    | The iso camera with 4 quarter-turn views and zoom levels and camera moves, palette, tones, filters (`@forgeron/shaders` presets)              |
| **Timeline** | Tracks (position, visibility, glide along a path, conveyor loops), loops, state machines driven by time or scroll, transitions between scenes |
| **Library**  | One file imports the Parts of another                                                                                                         |

**Compile** (`blueprint compile`): flatten assemblies, cull, rasterise with a real depth buffer (this removes `raise`/`lift`), and output SVG, sprite sheets, or a compact animated form played on canvas.

**3D:** stay isometric pixel, orthographic, with quarter-turn views. A free 3D camera would lose the style.

**Migration without regression:**

1. Write the format spec and a TS reader.
2. Convert the site's objects into a Part library.
3. Run pixel-parity tests, as in `packages/blueprint/docs/migration.md`: every current scene must render identically with the TS and the Rust engine.
4. Switch only then.

### Sites (to build)

- **`shaders.forgeron.sh`** (`apps/shaders`): the shader gallery, which takes over the gallery's Shaders section (keep a summary and a link in the UI gallery), plus the pass editor.
- **`blueprint.forgeron.sh`** (`apps/blueprint`): format docs, the Part library, a scene viewer; later the scene composer and timeline editor, built on canvas.
- Singular or plural names were not settled; ask the owner.

## 4. Next steps, in order (owner's priority)

1. **Realign canvas on a Rust engine.**
   - Start with a benchmark run by one agent: the TS core vs a `fg-canvas-core` prototype with 20k items.
   - Budgets: pan and zoom at 60 fps, hit test and lasso under 1 ms, a site scene compiled under 50 ms, WASM size.
   - Then add Rust to the toolchain, update D-148 with the numbers, and write D-149 (shaders) and D-150 (blueprint format and Rust core).
   - Then build `crates/` and the WebGL2 renderer behind the `CanvasEngine` and `Renderer` interfaces.
2. **Rebuild blueprint:**
   - Rust only where it pays (compile and rasterise); the TS API stays.
   - The advanced engine: scenes, loops, zoom and camera moves, objects (Parts and Assemblies), animations and timelines, rendered on canvas.
3. **`@forgeron/shaders`** in TS with the pass contract and presets, then the CPU passes in Rust, then the site.
4. **flow and draw on canvas** once the engine decision is made; the Data hub schema diagram on canvas.
5. **The two sites.**

## 5. Conventions learned this session

- Agents run in parallel without conflicts when each owns its files and the shared files (`index.ts`, `blocks.css`, `registry.ts`) are pre-wired before launch.
- **Gallery mechanics:**
  - examples live in `apps/ui-gallery/src/examples/<slug>/NN-name.tsx`, and the first one is the static thumbnail (rendered `inert`, without JS);
  - `components/thumbnails/<slug>.tsx` overrides the thumbnail of overlay blocks;
  - entries go in `src/entries/<group>.ts`, typed by `src/types.ts`, and are imported by `registry.ts` (importing types from the registry creates a cycle that dependency-cruiser rejects).
- **Every component holds its state with the hooks:** `useControllableState` for values, `useDisclosure` for open/closed, `useShortcuts` for keys (silent while typing or inside menus), `useActions` for one list of actions feeding the ⋯ menu, the context menu, the palette and the keys, `useListView` for a view's state.
- **The reference screen** is `apps/ui-gallery/src/examples/list-view/01-reference.tsx`. It shows:
  - the composable `DisplayMenu` parts and `DisplayWhen`;
  - `LayoutSwitch`, Timeline and CalendarView;
  - editable rows (`onIssueChange` and `editors`), row menus (`rowMenu` / `onRowAction` with `buildMenu`);
  - the palette;
  - shortcuts F, V, C, ⇧L ⇧B ⇧T ⇧C, ⌘K.
- **Lint rules that bite:**
  - no `new Date()` in render (use `useState(() => …)`);
  - no setState in effects (adjust state during render);
  - no ref reads during render;
  - no assignment to outer variables in test components;
  - `vi.fn<…>()` needs a type parameter;
  - no comma expressions.
