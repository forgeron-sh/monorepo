# Canvas engine: TypeScript or Rust/WebAssembly? (D-148 benchmark)

**Date**: 18/11/2026 · **Question**: should the core of `@forgeron/canvas` move to Rust compiled to WebAssembly? D-148 set the bar: 20,000 items panned and zoomed at 60 frames per second, a hit test under 1 ms, and the size of the `.wasm`.

**Short answer**: not now. The spatial index is what the engine is missing, not the language. With the same index, TypeScript already meets every D-148 target with a wide margin (20,000 items: a culled frame in a few hundredths of a millisecond, a hit test around a microsecond). Rust is 2 to 7 times faster again on the same algorithm, and its module is tiny (37 KB, 16 KB gzipped), but it buys time where there is already plenty, and costs a second toolchain. Keep the crate as a measured option and the `CanvasEngine` interface as the door; move to Rust when a workload that TypeScript cannot carry shows up (see "When to revisit").

## What was measured

Three engines, fed the same `Item` objects and answering in the same currency (string ids, a `Float32Array` of instances):

| engine      | what it is                                                                                                                                                                                                                        |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ts-scan`   | `createTsEngine` as it was before this benchmark (`packages/canvas/src/core/ts-engine.ts`): every query scans the items. Since the index went in, the bench runs it as `ts-engine` (see "After")                                  |
| `ts-index`  | the Rust crate's algorithm ported to TypeScript (first `bench/ts-grid.ts`, now the engine's own `packages/canvas/src/core/spatial-index.ts`, driven directly), so that the comparison is not "Rust beats a linear scan"           |
| `rust-wasm` | the crate `fg-canvas-core` (`crates/fg-canvas-core`) through wasm-bindgen, in two builds: `Oz` (size first, `opt-level = "z"` + `wasm-opt -Oz`, the one that would ship) and `O3` (speed first, `opt-level = 3` + `wasm-opt -O3`) |

The algorithm of the two indexed engines:

- **A hashed uniform grid** of 256-world-unit cells (about twice a typical item). An item is listed in each cell it touches; one that would touch more than 16 cells (a large frame) goes to a "big" list that every query visits. Chosen over an R-tree because canvas items are of similar sizes and the hot writes are moves: on a grid a move that stays in its cells is four stores, one that crosses an edge is a removal from a short list and an append, where an R-tree pays a delete, a reinsert and rebalancing. The big list covers the outliers.
- **One 32-byte record per item** (bounds, z, kind, flags, rank). Candidates come out of the grid in no particular order; a record is one cache line touched where a struct of arrays touched six (a first version used one; on a large box selection the record was faster, by a margin the loaded machine made hard to pin down).
- **A lazily sorted stacking order**: moves leave it alone; a change of z or an add marks it dirty, the next query sorts once and writes each item's rank.
- **Answers in stacking order without a sort**: a query marks the rank of each item it keeps in a bitmap and reads the bitmap in order (sorting the answer by rank cost more than the culling itself on large answers).
- **Scan or grid**: when the grid would visit more than an eighth of the items (a box over a quarter of the world, an overview), the query scans the stacking order instead: sequential reads beat random ones by about 8 times.
- **Bulk data in shared memory** (Rust): JavaScript writes a load or the slots of a move into a buffer of the module's memory and reads the culled instances, the box selection and the hit as typed-array views on that memory, without a copy. One call per operation: 2 per frame (`frame`, `instances_ptr`), 1 per hit, 2 per move.

A minimal **WebGL2 renderer** (`packages/canvas/bench/webgl2.ts`) draws the instance buffer of either engine in one instanced draw call (a quad per item, fill and a 1 px border, the camera in a uniform), so a frame can be measured end to end in a browser.

### Scenarios

A deterministic scene (seeded generator, `bench/scene-data.ts`): items 60–240 × 40–160 world units spread over a square whose side grows with √n (about 220 units between items), so a zoomed-in view shows a few hundred items at every size; one item in a thousand is a frame of 600–1,500 × 400–1,000 behind the others. Sizes 1,000, 5,000, 20,000 and 100,000. Screen 1,280 × 800, culling margin 100 px.

- **load**: the document from `Item[]` (the TypeScript engine sorts it; the indexed ones also build the index and the id ↔ slot table).
- **frame, explore**: 400 frames of a camera path that pans across the world zooming between 0.3 and 1.5: culling and building the instance buffer (in the browser, plus upload and draw submission).
- **frame, overview**: 400 frames with the whole world in view (every item visible): the worst case of the buffer build.
- **hit test**: 10,000 random points; per-call p50/p99, and the mean over a batch of 1,000 (the browser's timer is 5 µs even cross-origin isolated).
- **box select**: a box over the middle quarter of the world (5,158 items at 20k, 25,325 at 100k), touching and containing alternately, ids materialised as strings.
- **move 500**: 500 random items moved by ±37 units, the index (or the document) updated.
- **memory**: JS heap added by loading, after a full collection; the indexed engines' own account of their bytes; the WebAssembly linear memory (a high-water mark: it never shrinks).
- **boundary**: the cost of one call to an exported no-op.

Before timing anything, the runner checks that the four engines agree on 500 hit tests, two box selections, 30 culled frames and 200 hit tests after a move (5,000 items). They do.

### Machine and caveats

- Apple M4 (10 cores), 16 GB, macOS 27.2. Bun 1.4.3 (JavaScriptCore) for the CPU runs, headless Chrome (chrome-headless-shell 1254, V8) for the browser run. Rust 1.93.0, wasm-bindgen 0.2.130, wasm-opt (binaryen) 116.
- **The machine was heavily loaded**: a load average of 38–41 on 10 cores throughout (other headless Chromes and test runs). Every number is noisier and slower than on a quiet machine; p95/p99 especially. The ratios between engines, measured in the same conditions minutes apart, are what to read. Rerun on a quiet machine before quoting an absolute.
- Headless Chrome draws with **SwiftShader**, a CPU rasteriser: its draw times say nothing about a GPU and are given as indicative only. The CPU time of a frame (culling, buffer build, upload) is reported apart.

## Size of the module

| build                                                                 |     `.wasm` |        gzip |      brotli | JS glue | glue gzip |
| --------------------------------------------------------------------- | ----------: | ----------: | ----------: | ------: | --------: |
| `release` (`opt-level = "z"`, LTO, 1 codegen unit, `panic = "abort"`) |     57.4 KB |     22.5 KB |     19.0 KB | 11.2 KB |    2.7 KB |
| **`release` + `wasm-opt -Oz`** (would ship)                           | **37.0 KB** | **16.0 KB** | **13.5 KB** | 11.2 KB |    2.7 KB |
| `release-speed` (`opt-level = 3`)                                     |     55.0 KB |     21.7 KB |     17.6 KB | 11.2 KB |    2.7 KB |
| `release-speed` + `wasm-opt -O3`                                      |     45.0 KB |     18.2 KB |     14.8 KB | 11.2 KB |    2.7 KB |

Well under the 150–300 KB budget of D-148: no serde, no wgpu, `std` only for `Vec` and `HashMap`. A full engine (history, selection, snapping, the whole command set) would add to it; a guess, not measured: under 150 KB.

## Results, Bun (JavaScriptCore)

Times in ms unless marked; p50 / p95 / p99.

### Frame, explore (pan and zoom 0.3–1.5): culling + instance buffer

|       items |               ts-scan |              ts-index |        rust-wasm (Oz) |        rust-wasm (O3) |
| ----------: | --------------------: | --------------------: | --------------------: | --------------------: |
|       1,000 | 0.028 / 0.052 / 0.080 | 0.008 / 0.031 / 0.044 | 0.003 / 0.010 / 0.050 | 0.004 / 0.015 / 0.021 |
|       5,000 | 0.082 / 0.165 / 0.263 | 0.004 / 0.056 / 0.111 | 0.003 / 0.054 / 0.070 | 0.003 / 0.028 / 0.048 |
|  **20,000** | 0.283 / 0.455 / 0.569 | 0.018 / 0.082 / 0.284 | 0.007 / 0.029 / 0.044 | 0.003 / 0.015 / 0.020 |
| **100,000** |    1.39 / 3.10 / 8.31 | 0.034 / 0.099 / 0.134 | 0.007 / 0.023 / 0.029 | 0.012 / 0.039 / 0.054 |

About 370–410 items are visible on this path at every size.

### Frame, overview (every item in view)

|       items |               ts-scan |              ts-index |        rust-wasm (Oz) |        rust-wasm (O3) |
| ----------: | --------------------: | --------------------: | --------------------: | --------------------: |
|       1,000 | 0.066 / 0.095 / 0.280 | 0.011 / 0.029 / 0.063 | 0.013 / 0.020 / 0.056 | 0.003 / 0.020 / 0.020 |
|       5,000 | 0.124 / 0.397 / 0.599 | 0.047 / 0.179 / 0.380 | 0.028 / 0.104 / 0.318 | 0.016 / 0.047 / 0.162 |
|  **20,000** |   0.760 / 2.84 / 3.63 |  0.465 / 0.899 / 1.12 | 0.159 / 0.420 / 0.739 | 0.065 / 0.170 / 0.203 |
| **100,000** |    10.7 / 16.2 / 17.7 |    1.86 / 2.01 / 2.27 |   0.767 / 2.00 / 2.42 |  0.488 / 0.950 / 1.21 |

### Hit test, box select, move, load

|   items | engine         | hit p50 / p99 (µs) | hit mean (µs) | box p50 | move 500 p50 / p99 | load p50 |
| ------: | -------------- | -----------------: | ------------: | ------: | -----------------: | -------: |
|  20,000 | ts-scan        |        499 / 1,638 |           522 |   0.636 |        67.1 / 80.7 |     1.78 |
|  20,000 | ts-index       |          0.7 / 2.1 |          0.70 |   0.493 |       0.071 / 1.61 |     6.74 |
|  20,000 | rust-wasm (Oz) |          0.3 / 0.7 |          0.26 |   0.183 |      0.017 / 0.250 |     4.88 |
|  20,000 | rust-wasm (O3) |          0.3 / 0.6 |          0.24 |   0.049 |      0.012 / 0.099 |     2.99 |
| 100,000 | ts-scan        |      3,049 / 5,735 |         3,047 |    3.26 |          450 / 496 |     17.6 |
| 100,000 | ts-index       |          1.3 / 2.8 |          1.36 |    2.25 |      0.044 / 0.952 |     48.9 |
| 100,000 | rust-wasm (Oz) |          0.7 / 2.0 |          0.79 |    1.28 |      0.048 / 0.448 |     23.8 |
| 100,000 | rust-wasm (O3) |          0.6 / 1.4 |          0.61 |    1.04 |      0.056 / 0.212 |     24.5 |

The 1k and 5k rows are in the full output (`bun packages/canvas/bench/run.ts`); they say the same at a smaller scale (ts-scan hit: 22 µs at 1k, 92 µs at 5k).

### Memory

|   items | engine    |          JS heap added | engine's own count | wasm memory (high water) |
| ------: | --------- | ---------------------: | -----------------: | -----------------------: |
|  20,000 | ts-scan   |                 3.3 MB |                  – |                        – |
|  20,000 | ts-index  |                 5.9 MB |             3.4 MB |                        – |
|  20,000 | rust-wasm |  2.1 MB (the id table) |             3.2 MB |                   7.7 MB |
| 100,000 | ts-scan   |                 6.6 MB |                  – |                        – |
| 100,000 | ts-index  |                24.8 MB |            17.1 MB |                        – |
| 100,000 | rust-wasm | 11.5 MB (the id table) |            16.3 MB |                  31.4 MB |

The `Item` objects themselves weigh 3.3 MB at 20k and 16.7 MB at 100k, in every case: the indexed engines add to them, they do not replace them (data, ids and kinds stay in JavaScript). The engines' "own count" includes the instance buffer of an overview frame (2.4 MB at 100k). WebAssembly memory only grows: its high-water mark includes the load buffer and the doubling of vectors during the load.

### Boundary

One call to an exported no-op: **10.9 ns** under Bun (a JS no-op: 1.7 ns), **8–17 ns** in Chrome (0.8–3.7 ns), depending on the load. With 2 calls a frame, the boundary is invisible; it would not be with a call per item (100,000 × 10 ns = 1 ms a frame): bulk operations through shared buffers are a requirement of a WebAssembly engine, not an optimisation.

## Results, Chrome (V8, headless, SwiftShader)

Headless Chrome 158 (V8), WebGL2 through ANGLE on SwiftShader, cross-origin isolated (timer resolution 5 µs: per-call times below 5 µs read as 0, the batch mean is the number to read). Load average 47–54 during this run.

### Frame, explore: culling + buffer build, and the whole CPU side of the frame (+ upload + draw submission)

|                items |               ts-scan |              ts-index |        rust-wasm (Oz) |        rust-wasm (O3) |
| -------------------: | --------------------: | --------------------: | --------------------: | --------------------: |
|  20,000 cull + build | 0.240 / 0.570 / 0.750 | 0.010 / 0.050 / 0.060 | 0.005 / 0.020 / 0.035 | 0.005 / 0.010 / 0.015 |
|     20,000 CPU frame | 0.240 / 0.585 / 0.775 | 0.010 / 0.055 / 0.075 | 0.005 / 0.030 / 0.065 | 0.005 / 0.015 / 0.015 |
| 100,000 cull + build |    1.39 / 3.26 / 3.89 | 0.015 / 0.045 / 0.055 | 0.010 / 0.025 / 0.035 | 0.005 / 0.020 / 0.030 |
|    100,000 CPU frame |    1.40 / 3.28 / 3.92 | 0.015 / 0.045 / 0.060 | 0.010 / 0.030 / 0.035 | 0.010 / 0.025 / 0.030 |

400 frames each. Upload of ~400 instances: under the timer's resolution.

### Frame, overview (every item in view): culling + buffer build, p50

|   items | ts-scan | ts-index | rust-wasm (Oz) | rust-wasm (O3) |
| ------: | ------: | -------: | -------------: | -------------: |
|  20,000 |   0.930 |    0.250 |          0.130 |          0.165 |
| 100,000 |    6.52 |     1.24 |           1.46 |          0.305 |

Few samples (1 to 96 frames): SwiftShader takes seconds to rasterise 20,000–100,000 quads on this loaded CPU, the command queue fills, and the next upload blocks until it drains, which ate the time budget. The uploads that did not block cost 0.03–0.07 ms at 20k and 0.2–0.3 ms at 100k (2.4 MB). The CPU numbers agree with the Bun run; the frame totals of this scenario are not meaningful.

### Draw, waiting for the GPU (indicative: SwiftShader is a CPU rasteriser)

|   items | path     | visible | draw p50 (ms) |
| ------: | -------- | ------: | ------------: |
|  20,000 | explore  |     330 |           7.4 |
|  20,000 | overview |  20,000 |         2,161 |
| 100,000 | explore  |     319 |          25.8 |
| 100,000 | overview | 100,000 |         9,394 |

The same for every engine (they hand it the same buffer). On a real GPU these are expected to be a small fraction of a frame; not measured.

### Hit test, box select, move (V8)

|   items | engine         | hit mean (µs) | hit p50 / p99 (µs) | box p50 | move 500 p50 / p99 | load p50 |
| ------: | -------------- | ------------: | -----------------: | ------: | -----------------: | -------: |
|  20,000 | ts-scan        |           508 |        425 / 1,200 |   0.445 |         81.9 / 104 |     1.05 |
|  20,000 | ts-index       |          0.28 |            < 5 / 5 |   0.800 |       0.035 / 1.03 |     4.23 |
|  20,000 | rust-wasm (Oz) |          0.35 |            < 5 / 5 |   0.330 |      0.020 / 0.680 |     4.31 |
|  20,000 | rust-wasm (O3) |          0.18 |            < 5 / 5 |   0.185 |      0.030 / 0.785 |     2.53 |
| 100,000 | ts-scan        |         2,024 |      2,100 / 3,365 |    2.30 |          327 / 665 |     10.1 |
| 100,000 | ts-index       |          0.95 |            < 5 / 5 |    1.97 |       0.065 / 2.49 |     22.0 |
| 100,000 | rust-wasm (Oz) |          0.70 |            < 5 / 5 |    1.41 |       0.040 / 1.26 |     16.9 |
| 100,000 | rust-wasm (O3) |          0.31 |            < 5 / 5 |    1.12 |       0.045 / 1.47 |     17.1 |

Memory in Chrome is not reported: `performance.memory` with `--enable-precise-memory-info` and a forced `gc()` still gave negative deltas on this machine. The engines' own counts and the WebAssembly memory (25.1 MB high water at 100k) match the Bun run. Boundary: 16.5 ns per call to a no-op (3.7 ns for a JS no-op) under this load.

## What dominated

1. **The scans of the current engine, not its language.** `ts-scan` sorts every item on every hit test (`topDown` copies and sorts the document: 0.5 ms at 20k, 3 ms at 100k, a miss of the 1 ms target), culls by testing every item (1.4 ms a frame at 100k zoomed in), and moves through `applyPatches`, which maps the whole document once per patch (500 patches × 20,000 items: 67 ms; 450 ms at 100k: a drag of a large selection would stutter). All three are fixed in TypeScript by the index and by applying patches through a map: `ts-index` moves 500 items in 0.07 ms. **After**: done in `createTsEngine` itself (see "After").
2. **With the same index, the language is a factor of 2 to 7**, on times that are already small. At 20,000 items zoomed in, a frame costs 0.02 ms in TypeScript and 0.003–0.007 ms in Rust: both are under 0.2 % of a 16.7 ms frame. The gap matters only where every item is touched each frame: an overview of 100,000 items costs 1.9 ms in TypeScript and 0.5–0.8 ms in Rust.
3. **Drawing, not culling, sets the frame time** once the index is in. Uploading 100,000 instances is 2.4 MB a frame; drawing them is the GPU's work, the same whichever engine built the buffer. In headless Chrome SwiftShader takes tens of milliseconds to rasterise a frame on a loaded CPU; on a real GPU an instanced draw of 100,000 quads is expected to be well under a frame (not measured here).
4. **Data layout mattered as much as the language.** Moving from a struct of arrays to one record per item, and gathering through a rank bitmap instead of sorting, made large box selections several times faster in both languages (natively, a box of 25,000 items out of 100,000 went from 4–8 ms to about 1 ms); a weak hash (the bare FxHash multiply, whose low bits depend on `cy` only) had piled whole columns of cells into one probe chain. These were found and fixed in both engines.
5. **Load is the one place the indexed engines are slower**: building the index and the id table costs 5–7 ms at 20k and 24–49 ms at 100k, against a sort for `ts-scan`. Acceptable for opening a document; a bulk build (sort items by cell, then fill) would cut it if it ever matters.

## Recommendation: TypeScript with the index now, Rust kept as an option

**Put the spatial index in the TypeScript engine now** (promote `bench/ts-grid.ts` into `src/core/`, behind `createTsEngine`'s queries `hit`, `in-rect`, `visible`; drop the per-hit sort; apply patches through the id map). That alone takes the engine from failing D-148's hit-test target at 20k (0.5 ms p50, 1.6 ms p99) and stuttering on large moves, to meeting every target with two orders of magnitude to spare, with no new toolchain. **Do not move the core to Rust yet**: on the same algorithm it is 2–7 times faster, but on paths that already cost well under a millisecond at 20,000 items, while it brings a second language, a build step (rustup, the wasm target, wasm-bindgen pinned to the crate, wasm-opt) in CI and in every contributor's setup, and a JavaScript/WebAssembly boundary that every new feature has to be designed around. **Keep `crates/fg-canvas-core` and this benchmark** as the measured path, and revisit when the blueprint scene engine (isometric, animated) arrives: many animated items whose geometry is recomputed every frame (sprites sorted by depth, paths, particles) is the workload where per-item CPU work scales with the visible count every frame, and where the 3–5× of the O3 build and the absence of garbage collection would pay. Flow and draw need not wait: they sit on `CanvasEngine`, which this work does not change.

### After: the index in `createTsEngine` (18/11/2026)

The grid went into the engine (`packages/canvas/src/core/spatial-index.ts`, behind an id table in `item-index.ts`): `hit`, `in-rect`, `in-lasso`, `visible` and `nearest` ask it; the per-hit copy and sort is gone; patches are applied by id, the item list is copied once per change and sorted again only when z changes, an item is added or removed. `bench/ts-grid.ts` is removed and `ts-index` drives the production index. Rerun under Bun, `--sizes 20000,100000`, load average 40–47 (the same noisy machine); `ts-engine` is `createTsEngine` through `CanvasEngine`, ids in and out:

|   items | engine            | hit p50 / p99 (µs) | move 500 p50 / p99 (ms) | explore p50 / p99 (ms) | overview p50 (ms) | box p50 | load p50 |
| ------: | ----------------- | -----------------: | ----------------------: | ---------------------: | ----------------: | ------: | -------: |
|  20,000 | before (ts-scan)  |        499 / 1,638 |             67.1 / 80.7 |          0.283 / 0.569 |             0.760 |   0.636 |     1.78 |
|  20,000 | after (ts-engine) |      **0.6 / 2.0** |         **0.16 / 1.31** |      **0.016** / 0.542 |              1.12 |   0.488 |     8.92 |
| 100,000 | before (ts-scan)  |      3,049 / 5,735 |               450 / 496 |            1.39 / 8.31 |              10.7 |    3.26 |     17.6 |
| 100,000 | after (ts-engine) |      **1.0 / 2.9** |         **0.20 / 0.98** |      **0.052** / 0.279 |              13.5 |    2.44 |     57.9 |

`createTsEngine` now meets D-148's targets: a hit test p99 of 2 µs at 20,000 items (the target is 1 ms), and moving 500 items in a fifth of a millisecond at 100,000. The overview through the interface is not faster: its time is the harness looking up 100,000 ids one by one through `get` (4–6 ms), not the culling (the `visible` query alone: about 2 ms at 100k; `ts-index` builds the whole buffer in 1.95 ms). Load is slower (the index and the id table are built: 9 ms at 20k, 58 ms at 100k), and the JS heap added grows from 3.3 to 9.3 MB at 20k. One behaviour changed: a kind's own `hitTest` is asked only for points inside the item's bounds, and between items of equal z the one drawn last is hit (the scan hit the one drawn first).

### Risks of each path

- **Rust core**: build complexity (a pinned Rust toolchain next to proto, `wasm-bindgen` CLI pinned to the exact crate version or the glue breaks, `wasm-opt` optional but worth 35 %); a slower edit-compile loop for interaction work, which D-148 wanted cheap; the boundary forces bulk APIs; strings (ids, kinds) and item data stay in JavaScript anyway, so the engine is split in two halves to keep in sync; memory never shrinks (`memory.grow` only).
- **TypeScript with an index**: performance depends on the JIT (JavaScriptCore and V8 differ: compare the two result sets); GC pauses are possible if the hot paths allocate (they do not: typed arrays, reused buffers); the overview of 100k items is the first place it would run short (1.9 ms of a 16.7 ms frame, before drawing).

### What a WebAssembly engine would need to pass the contract

The 14 tests of `packages/canvas/src/core/engine-contract.ts` are the bar. The crate today owns geometry, the index, hit testing, box selection and culling; to run the suite through `engineContract("Rust", …)` it would also need, behind a TypeScript `CanvasEngine` shell:

- the id ↔ slot table and item data (`data`, `kind` strings) on the JavaScript side, with `get`, `getState().items` (bottom first) and `subscribe` rebuilt from the slots;
- history as patches (undo, redo, gestures that record one step, cancel, coalesced nudges), selection (with locked items skipped by select-all), clipboard and paste offsets, duplicate, bring to front and send to back (z writes, then the lazy order);
- kinds as data (resize rules, `movable`, `selectable`) since the TypeScript kinds hold functions: a declared shape in Rust, with a JavaScript hit test as the slow path for kinds that define their own (D-148 already says so);
- the viewport arithmetic (zoom presets, fit, whole-pixel rounding), `nearest`, `reading-order`, lasso (point in polygon on centres), `handle-at`, `handles`, read-only, and `serialize`/`load` with the version field.

A thin TypeScript shell owning ids, data, history and selection, with the crate answering the spatial queries, is the realistic shape; it is also exactly what the TypeScript engine with an index would look like, which is one more reason to build that first: the shell is shared, and swapping the index for the crate later is local.

## After the fixes (19/11/2026): the editors on a real GPU

The engine was never the cost in the editors. A diagnosis with GPU traces (headless Chrome on the M4's GPU through ANGLE/Metal, 1,440 × 900 at 2×) put the cost of a pan or zoom step in the DOM around the engine: global sibling selectors in `@forgeron/ui` that restyled the whole canvas each time culling mounted or unmounted an item, culling that churned at every step, a renderer that rewrote the DOM every frame, `<Canvas>` re-rendering on every camera move, and a minimap repainting every item. Fixed in that order:

1. **No universal sibling selectors in ui.** `.fg-avatars > * + *`, `.fg-cmp-row > * + *`, `.fg-fm-sum-top > div + div`, `.fg-fm-nps > div + div`, `.fg-display-layout + *` and `.fg-fbr-slides > i + i` became class selectors (a class on the cells, padding on the avatar stack, the hidden second slide removed). Boxes identical and screenshot hashes identical on the 11 gallery pages that show them.
2. **A cull window with hysteresis** (`cullWindow`, `useCullWindow`): the view plus twice the overscan, kept while the view plus the overscan stays inside it and the zoom has not grown by half. A small pan mounts and unmounts nothing; a long one moves the window in steps.
3. **The DOM renderer writes only what changed**: the size, the transform, the primitives (by identity) and the selection chrome (by what it draws); the grid colour is read once, again on a theme change or a resize.
4. **The camera outside React**: `<Canvas>` subscribes to the items, the selection, the tool and the cull window; a store listener moves the world layer and redraws the renderer. No scan of every item per step.
5. **The minimap's items in an offscreen bitmap**, rebuilt when the items, the selection, the colours or the mapping change; a camera move copies it and draws the frame, without rendering.
6. **Flow edges culled** to those whose box (`edgeBounds`) meets the cull window, plus the selected and dragged ones; the insert button rendered only while its edge is hovered or selected (it was `display: none` otherwise).

Tried and not kept: compositing the world layer (`will-change: transform`, with a backing element under the items it stays at 18 layers instead of 1,026) left draw at fit at 5.6 ms a step with more paint (2.4 ms), made zoom slower (7.7 ms, 16 long tasks) and moved pixels of the dither patterns at 50–75 %; dropping `vector-effect: non-scaling-stroke` from flow edges or from draw's far pen strokes changed nothing measurable (±0.1 ms).

Main thread per wheel step, 120 steps per scenario; frame cost p50 / p95; style, layout and paint per step; long tasks are main-thread tasks over 12 ms. The draw page has 2,000 items, the flow page 500 nodes and 700 edges; "fit" is the page's opening view (10 %), "100 %" after the `0` key. Before is `98d358e1`; after is the working tree on `de9c93da` (the second of two runs; the first was up to 0.4 ms slower on draw and up to 0.9 ms on flow).

| page, gesture    | before main/step | after main/step | frame p50 / p95 before → after | style       | layout      | paint       | long tasks |
| ---------------- | ---------------: | --------------: | -----------------------------: | ----------- | ----------- | ----------- | ---------- |
| draw fit, pan    |              7.3 |         **5.5** |       12.5 / 33.3 → 8.6 / 27.8 | 1.55 → 0.22 | 0.45 → 0.15 | 1.59 → 1.91 | 24 → 8     |
| draw fit, zoom   |              7.4 |         **6.1** |       12.2 / 30.0 → 8.6 / 26.2 | 1.35 → 0.39 | 0.44 → 0.39 | 1.41 → 1.48 | 19 → 10    |
| draw 100 %, pan  |              3.1 |         **2.5** |          5.9 / 7.1 → 4.0 / 9.7 | 0.43 → 0.13 | 0.15 → 0.08 | 0.30 → 0.42 | 0 → 0      |
| draw 100 %, zoom |              3.4 |         **2.9** |         5.9 / 12.7 → 4.7 / 9.7 | 0.46 → 0.19 | 0.21 → 0.22 | 0.34 → 0.41 | 0 → 1      |
| flow fit, pan    |              3.7 |         **2.4** |         5.1 / 15.3 → 2.4 / 9.9 | 0.34 → 0.10 | 0.29 → 0.06 | 0.84 → 0.69 | 0 → 0      |
| flow fit, zoom   |              5.1 |         **4.3** |        9.3 / 14.2 → 7.3 / 15.6 | 0.75 → 0.20 | 0.37 → 0.34 | 1.44 → 1.33 | 2 → 2      |
| flow 100 %, pan  |              3.6 |         **2.1** |          6.9 / 9.0 → 3.6 / 8.0 | 0.61 → 0.10 | 0.26 → 0.08 | 0.67 → 0.52 | 0 → 0      |
| flow 100 %, zoom |              3.9 |         **3.3** |        6.8 / 14.9 → 5.5 / 14.6 | 0.59 → 0.19 | 0.30 → 0.29 | 0.69 → 0.67 | 1 → 1      |

At 4× CPU throttling:

| page, gesture    | main/step before → after | frame p50 / p95 before → after | style       | layout      | paint       | long tasks |
| ---------------- | -----------------------: | -----------------------------: | ----------- | ----------- | ----------- | ---------- |
| draw fit, pan    |          16.6 → **13.2** |        35.9 / 167 → 19.2 / 100 | 3.99 → 0.67 | 1.15 → 0.44 | 3.04 → 4.22 | 54 → 37    |
| draw fit, zoom   |          17.4 → **16.9** |        43.2 / 151 → 36.9 / 160 | 3.62 → 1.53 | 1.17 → 1.42 | 2.89 → 3.27 | 63 → 44    |
| draw 100 %, pan  |            7.6 → **4.5** |         14.3 / 19.0 → 7.5 / 18 | 1.06 → 0.26 | 0.35 → 0.17 | 0.79 → 0.76 | 0 → 0      |
| draw 100 %, zoom |            9.9 → **8.3** |        17.5 / 45.4 → 14.5 / 35 | 1.43 → 0.56 | 0.62 → 0.65 | 0.94 → 1.05 | 28 → 15    |
| flow fit, pan    |           10.1 → **7.6** |      12.7 / 55.9 → 10.2 / 46.4 | 1.02 → 0.45 | 0.77 → 0.23 | 2.07 → 1.73 | 35 → 23    |
| flow fit, zoom   |          15.1 → **12.7** |      42.7 / 73.9 → 29.0 / 73.9 | 2.58 → 0.75 | 1.33 → 1.13 | 3.33 → 3.63 | 66 → 49    |
| flow 100 %, pan  |           11.9 → **6.7** |      23.8 / 31.3 → 11.9 / 26.5 | 1.94 → 0.29 | 0.88 → 0.29 | 2.17 → 1.74 | 53 → 10    |
| flow 100 %, zoom |           11.8 → **9.7** |      20.3 / 64.8 → 16.5 / 54.3 | 1.90 → 0.70 | 0.96 → 1.02 | 1.70 → 1.65 | 41 → 23    |

Draw at fit, one fix at a time (main thread per pan step, normal CPU): 7.3 → 6.7 (selectors) → 6.4 (cull window) → 6.0 (renderer) → 5.6 (camera outside React) → 5.4 (minimap). Each fix's step was measured once; two runs of the same build differ by up to 0.4 ms on draw and 0.9 ms on flow. Compositor layers stay at 16 (draw) and 19 (flow). The editors' pixels are the same: 11 states of the canvas, draw and flow pages (opening view, 100 %, zoomed by keys, panned) are identical to the pixel before and after.

What is left: drawing 2,000 DOM items at 10 % is now the cost (paint 1.9 ms and layerize 0.9 ms of the 5.5), slightly more than before because the cull window keeps up to twice the overscan mounted; draw at fit stays above 4 ms a step on this machine and about 13 ms at 4× throttling. Zoom at fit still has 10 long tasks: the cull window moves in steps (hundreds of items mounted at once), and draw's far/near switch at 35 % re-renders every item. The next step is the WebGL2 renderer of D-148 for the far zoom (one instanced draw of the primitives, the DOM overlay only near), not more DOM work. Flow at fit churns more edges than before in bursts (20 nodes per wheel against 8) as the window moves, for less paint at 100 %.

## Far-zoom renderer (20/11/2026)

Below the far zoom (draw 35 %, flow 40 %) the items are no longer DOM: `<Canvas far={{ zoom, kinds, below, keep }}>` asks each kind for primitives (`kinds[kind](item, { selected }) → FarPrimitive[]`: rect, ellipse, diamond, polyline, triangle, one line of text), packs them as 64-byte instances (`core/far.ts`, pure) and draws them on one WebGL2 surface under the DOM items (`react/far-layer.ts`): one instanced call per layer (`below`: flow's edges; `items`: the culled items, then the selection's outlines), six vertices per instance, edges covered by signed distance (no multisampling), a stroke thinner than a device pixel drawn one pixel wide at its share of the colour, as the DOM's scaled borders are. A pan or a zoom sets three uniforms; the buffers are rebuilt only when the items, the selection or the cull window change. Without WebGL2, or when its context is lost, a 2D canvas draws the same instances. Colours are tokens or any CSS colour (`color-mix` included), resolved on the surface once and again on a theme change. Texts (flow's node names, frame names) go on a 2D canvas a margin larger than the view, moved by a CSS transform on a pan and redrawn on a zoom. Dither fills are a flat wash of their colour (40 %), as the DOM's far view drew them: a 4 × 4 pattern of 2-unit pixels is under a screen pixel at these zooms and would alias into moiré. Hit testing is the engine's (`hit`), as before. Near zoom is the DOM, unchanged.

Crossing the threshold: the DOM moves towards what it must hold a few items a frame (the count adapted so a step takes about 6 ms, unmounting four times as many), while the far layer draws the items not mounted yet; `renderItem` learns the view from `state.far`, so mounted items do not re-render at the switch. Flow's DOM edges come back 32, 64, 128… a frame, the far layer drawing all edges until they are there.

Same harness and machine as "After the fixes" (headless Chrome on the M4 through ANGLE/Metal, 1,440 × 900 at 2×, 120 wheel steps). Before is `a5bc6148`, after the working tree; both measured back to back. "cross" starts at 50 % and zooms out to 27 % and back twice (four crossings of draw's 35 % and flow's 40 %). Long tasks are main-thread tasks over 12 ms.

| page, gesture   | main/step before → after | frame p50 / p95 before → after | paint       | long tasks (max ms) |
| --------------- | -----------------------: | -----------------------------: | ----------- | ------------------- |
| draw fit, pan   |            5.2 → **2.1** |         8.6 / 24.0 → 3.7 / 6.4 | 1.79 → 0.12 | 6 (19) → 0          |
| draw fit, zoom  |            6.5 → **3.4** |        8.5 / 30.2 → 4.1 / 11.6 | 1.56 → 0.41 | 15 (40) → 0         |
| draw cross      |            4.6 → **4.2** |         6.7 / 21.9 → 6.6 / 9.6 | 0.78 → 0.53 | 4 (35) → 1 (13)     |
| draw 100 %, pan |                2.1 → 1.9 |          3.4 / 8.4 → 3.1 / 6.6 | 0.30 → 0.28 | 0 → 0               |
| flow fit, pan   |            3.2 → **1.7** |         3.6 / 13.3 → 2.8 / 5.1 | 0.87 → 0.11 | 1 (13) → 0          |
| flow fit, zoom  |            5.7 → **5.2** |        9.3 / 19.8 → 6.8 / 16.5 | 1.63 → 0.68 | 2 (28) → 3 (16)     |
| flow cross      |                4.6 → 5.2 |        6.7 / 20.8 → 7.6 / 16.0 | 1.34 → 0.71 | 4 (24) → 1 (15)     |
| flow 100 %, pan |                3.0 → 3.0 |        5.2 / 10.8 → 5.0 / 11.5 | 0.70 → 0.72 | 0 → 0               |

At 4× CPU throttling:

| page, gesture  | main/step before → after | frame p50 / p95 before → after | long tasks (max ms) |
| -------------- | -----------------------: | -----------------------------: | ------------------- |
| draw fit, pan  |           13.6 → **7.5** |       20.7 / 109 → 13.3 / 22.1 | 39 (64) → 3 (14)    |
| draw fit, zoom |          17.8 → **11.0** |       56.9 / 150 → 14.8 / 22.7 | 52 (169) → 3 (14)   |
| draw cross     |              15.6 → 14.6 |       41.5 / 162 → 27.7 / 54.4 | 59 (192) → 46 (55)  |
| flow fit, pan  |            9.3 → **5.7** |       13.0 / 55.1 → 9.3 / 18.2 | 27 (52) → 2 (17)    |
| flow fit, zoom |              13.7 → 13.5 |      35.2 / 72.1 → 23.1 / 50.8 | 55 (85) → 45 (31)   |
| flow cross     |              13.9 → 12.8 |      31.3 / 59.0 → 17.6 / 49.3 | 62 (101) → 38 (46)  |

The switch alone (one key from 50 % to 25 % and back, twice; main-thread tasks over 12 ms in the 5 s): draw 4 (27, 29, 33, 13) → 0, flow 0 → 0; at 4× draw 8 (78, 32, 47, 16, 68, 23, 41, 12) → 5 (21, 13, 17, 15, 15), flow 9 (max 39) → 10 (max 29). The long tasks left at 4× in "cross" are the near-zoom steps themselves (300 to 400 DOM items between 35 and 50 %), present before too.

Draw at fit is now 2.1 ms a pan step (target 2), of which script 1.06: the minimap rebuilding its bitmap as the view leaves the items (its token colours are now read once per theme), the grid's dots and React when the cull window moves; the far layer itself is a few hundredths. Flow at fit zoom gains less: half of that gesture is above 40 % (it zooms to 110 %), where nodes are rich cards. The GPU does a little more per frame (3.7 → 4 to 5 ms on the GPU thread, a full-screen WebGL canvas redrawn each step), still far from a frame.

Compositor layers stay 16 (draw) and 19 (flow) plus the far canvas at rest; while the DOM catches up after a switch, the items over the WebGL canvas are composited on their own (up to about 110 layers for a few frames).

Screenshots (`scratchpad/far/shots`, 1,440 × 900 at 2×): near zoom is identical to the pixel in the 11 near states of the gallery's canvas, draw and flow pages (opening views, 50 to 200 %, panned; two first-run differences of the canvas page and one pixel at 200 % did not reproduce on a second run); at far zoom the boxes, ellipses, diamonds, stickies and frames match, pen strokes are slightly smoother, flow's names are drawn by the 2D canvas instead of the DOM (slightly brighter at 10 %).

Not done: flow edges are clickable at far zoom only when selected (the DOM keeps those); dashed strokes (draw's dashed arrows, flow's skipped edges) and running edges' marching dashes are solid at far zoom; nothing hovers at far zoom (nothing did); flow's group frames stay DOM, so their 3 % wash now lies over the nodes; images stay DOM; a real GPU other than the M4, VoiceOver, touch.

## When to revisit

- A scene that needs per-frame CPU work proportional to the visible items beyond culling (the isometric blueprint: depth sorting, animation, geometry generation), at thousands of items.
- An overview of 100,000+ items held at 60 fps on a mid-range laptop, measured on a real GPU, where the TypeScript buffer build shows in the profile.
- Rerun this benchmark on a quiet machine and on a real GPU (`bun packages/canvas/bench/browser.ts` with `CHROME` pointing at a headed Chrome) before the decision is final.

## Reproducing

Toolchain (once; no sudo, everything under `~/.rustup` and `~/.cargo`):

```sh
rustup toolchain install 1.93.0 --profile minimal --component clippy,rustfmt --target wasm32-unknown-unknown
cargo install --locked wasm-bindgen-cli --version =0.2.130
cargo install --locked wasm-opt --version =0.116.1   # optional: 35 % smaller
```

`rust-toolchain.toml` pins the channel and the wasm target; the workspace (`Cargo.toml`, `Cargo.lock`) is at the root of the repository, with `target/` ignored. With Homebrew's `rustup`, its proxies are in `$(brew --prefix rustup)/bin`; the build script asks `rustup which` for the pinned `cargo` and `rustc`, so it works whatever `cargo` comes first on `PATH`.

```sh
cargo test -p fg-canvas-core                       # the crate agrees with a linear scan
bun packages/canvas/bench/build-wasm.ts            # builds both variants, prints the size table
bun packages/canvas/bench/run.ts                   # Bun / JavaScriptCore; --sizes 1000,20000 --quick
bun packages/canvas/bench/browser.ts               # headless Chrome / V8 + WebGL2
```

Results are written to `target/bench/bun.json` and `target/bench/browser.json`.
