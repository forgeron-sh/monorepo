# Canvas engine: TypeScript or Rust/WebAssembly? (D-148 benchmark)

**Date**: November 18, 2026 · **Question**: should the core of `@forgeron/canvas` move to Rust compiled to WebAssembly? D-148 set the bar: 20,000 items panned and zoomed at 60 frames per second, a hit test under 1 ms, and the size of the `.wasm`.

**Short answer**: not now. The spatial index is what the engine is missing, not the language. With the same index, TypeScript already meets every D-148 target on the CPU side with a wide margin (20,000 items: a culled frame in a few hundredths of a millisecond, a hit test around a microsecond); drawing on a real GPU was not measured in this run. On the same algorithm Rust is 2 to 7 times faster again on most paths under Bun (10 times on one, a box selection at 20,000 items in the speed build), and in Chrome the size build that would ship is at times no faster (hit test at 20,000 items, overview at 100,000). Its module is tiny (37 KB, 16 KB gzipped), but it buys time where there is already plenty, and costs a second toolchain. Keep the crate as a measured option and the `CanvasEngine` interface as the door; move to Rust when a workload that TypeScript cannot carry shows up (see "When to revisit").

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
- **box select**: a box over the middle quarter of the world (5,158 items at 20k, 25,325 at 100k), touching and containing alternately, ids materialized as strings.
- **move 500**: 500 random items moved by ±37 units, the index (or the document) updated.
- **memory**: JS heap added by loading, after a full collection; the indexed engines' own account of their bytes; the WebAssembly linear memory (a high-water mark: it never shrinks).
- **boundary**: the cost of one call to an exported no-op.

Before timing anything, the runner checks that the four engines agree on 500 hit tests, two box selections, 30 culled frames and 200 hit tests after a move (5,000 items). They do.

### Machine and caveats

- Apple M4 (10 cores), 16 GB, macOS 27.2. Bun 1.4.3 (JavaScriptCore) for the CPU runs, headless Chrome (chrome-headless-shell 1254, V8) for the browser run. Rust 1.93.0, wasm-bindgen 0.2.130, wasm-opt (binaryen) 116.
- **The machine was heavily loaded**: a load average of 38–41 on 10 cores throughout (other headless Chromes and test runs). Every number is noisier and slower than on a quiet machine; p95/p99 especially. The ratios between engines, measured in the same conditions minutes apart, are what to read. Rerun on a quiet machine before quoting an absolute.
- Headless Chrome draws with **SwiftShader**, a CPU rasterizer: its draw times say nothing about a GPU and are given as indicative only. The CPU time of a frame (culling, buffer build, upload) is reported apart.

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

One call to an exported no-op: **10.9 ns** under Bun (a JS no-op: 1.7 ns), **8–17 ns** in Chrome (0.8–3.7 ns), depending on the load. With 2 calls a frame, the boundary is invisible; it would not be with a call per item (100,000 × 10 ns = 1 ms a frame): a WebAssembly engine has to move data in bulk through shared buffers.

## Results, Chrome (V8, headless, SwiftShader)

Headless Chrome 158 (V8), WebGL2 through ANGLE on SwiftShader, cross-origin isolated (timer resolution 5 µs: per-call times below 5 µs read as 0, the batch mean is the number to read). Load average 47–54 during this run. Times in ms unless marked; p50 / p95 / p99.

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

Few samples (1 to 96 frames): SwiftShader takes seconds to rasterize 20,000–100,000 quads on this loaded CPU, the command queue fills, and the next upload blocks until it drains, which ate the time budget. The uploads that did not block cost 0.03–0.07 ms at 20k and 0.2–0.3 ms at 100k (2.4 MB). The CPU numbers agree with the Bun run; the frame totals of this scenario are not meaningful.

### Draw, waiting for the GPU (indicative: SwiftShader is a CPU rasterizer)

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
2. **With the same index, the language is a factor of 2 to 7 on most paths under Bun** (10 on the 20k box selection in the O3 build; in Chrome the Oz build is at times slower than `ts-index`), on times that are already small. At 20,000 items zoomed in, a frame costs 0.02 ms in TypeScript and 0.003–0.007 ms in Rust: both are under 0.2 % of a 16.7 ms frame. The gap matters only where every item is touched each frame: an overview of 100,000 items costs 1.9 ms in TypeScript and 0.5–0.8 ms in Rust.
3. **Drawing, not culling, sets the frame time** once the index is in. Uploading 100,000 instances is 2.4 MB a frame; drawing them is the GPU's work, the same whichever engine built the buffer. In headless Chrome SwiftShader takes tens of milliseconds to rasterize a frame on a loaded CPU; on a real GPU an instanced draw of 100,000 quads is expected to be well under a frame (not measured here).
4. **Data layout mattered as much as the language.** Moving from a struct of arrays to one record per item, and gathering through a rank bitmap instead of sorting, made large box selections several times faster in both languages (natively, a box of 25,000 items out of 100,000 went from 4–8 ms to about 1 ms); a weak hash (the bare FxHash multiply, whose low bits depend on `cy` only) had piled whole columns of cells into one probe chain. These were found and fixed in both engines.
5. **Load is the one place the indexed engines are slower**: building the index and the id table costs 3–7 ms at 20k and 24–49 ms at 100k, against a sort for `ts-scan`. Acceptable for opening a document; a bulk build (sort items by cell, then fill) would cut it if it ever matters.

## Recommendation: TypeScript with the index now, Rust kept as an option

**Put the spatial index in the TypeScript engine now** (promote `bench/ts-grid.ts` into `src/core/`, behind `createTsEngine`'s queries `hit`, `in-rect`, `visible`; drop the per-hit sort; apply patches through the id map). That alone takes the engine from failing D-148's hit-test target at 20k (0.5 ms p50, 1.6 ms p99) and stuttering on large moves, to meeting every target with two orders of magnitude to spare, with no new toolchain. **Do not move the core to Rust yet**: on the same algorithm it is 2–7 times faster on most paths, but on paths that already cost well under a millisecond at 20,000 items, while it brings a second language, a build step (rustup, the wasm target, wasm-bindgen pinned to the crate, wasm-opt) in CI and in every contributor's setup, and a JavaScript/WebAssembly boundary that every new feature has to be designed around. **Keep `crates/fg-canvas-core` and this benchmark** as the measured path, and revisit when the blueprint scene engine (isometric, animated) arrives: many animated items whose geometry is recomputed every frame (sprites sorted by depth, paths, particles) is the workload where per-item CPU work scales with the visible count every frame, and where the 3–5× of the O3 build and the absence of garbage collection would pay. Flow and draw need not wait: they sit on `CanvasEngine`, which this work does not change.

### After: the index in `createTsEngine` (November 18, 2026)

The grid went into the engine (`packages/canvas/src/core/spatial-index.ts`, behind an id table in `item-index.ts`): `hit`, `in-rect`, `in-lasso`, `visible` and `nearest` ask it; the per-hit copy and sort is gone; patches are applied by id, the item list is copied once per change and sorted again only when z changes, an item is added or removed. `bench/ts-grid.ts` is removed and `ts-index` drives the production index. Rerun under Bun, `--sizes 20000,100000`, load average 40–47 (the same noisy machine); `ts-engine` is `createTsEngine` through `CanvasEngine`, ids in and out:

|   items | engine            | hit p50 / p99 (µs) | move 500 p50 / p99 (ms) | explore p50 / p99 (ms) | overview p50 (ms) | box p50 | load p50 |
| ------: | ----------------- | -----------------: | ----------------------: | ---------------------: | ----------------: | ------: | -------: |
|  20,000 | before (ts-scan)  |        499 / 1,638 |             67.1 / 80.7 |          0.283 / 0.569 |             0.760 |   0.636 |     1.78 |
|  20,000 | after (ts-engine) |      **0.6 / 2.0** |         **0.16 / 1.31** |      **0.016** / 0.542 |              1.12 |   0.488 |     8.92 |
| 100,000 | before (ts-scan)  |      3,049 / 5,735 |               450 / 496 |            1.39 / 8.31 |              10.7 |    3.26 |     17.6 |
| 100,000 | after (ts-engine) |      **1.0 / 2.9** |         **0.20 / 0.98** |      **0.052** / 0.279 |              13.5 |    2.44 |     57.9 |

`createTsEngine` now meets D-148's targets: a hit test p99 of 2 µs at 20,000 items (the target is 1 ms), and moving 500 items in a fifth of a millisecond at 100,000. The overview through the interface is not faster: its time is the harness looking up 100,000 ids one by one through `get` (4–6 ms), not the culling (the `visible` query alone: about 2 ms at 100k; `ts-index` builds the whole buffer in 1.95 ms). Load is slower (the index and the id table are built: 9 ms at 20k, 58 ms at 100k), and the JS heap added grows from 3.3 to 9.3 MB at 20k. One behavior changed: a kind's own `hitTest` is asked only for points inside the item's bounds, and between items of equal z the one drawn last is hit (the scan hit the one drawn first).

### Risks of each path

- **Rust core**: build complexity (a pinned Rust toolchain next to proto, `wasm-bindgen` CLI pinned to the exact crate version or the glue breaks, `wasm-opt` optional but worth 35 %); a slower edit-compile loop for interaction work, which D-148 wanted cheap; the boundary forces bulk APIs; strings (ids, kinds) and item data stay in JavaScript anyway, so the engine is split in two halves to keep in sync; memory never shrinks (`memory.grow` only).
- **TypeScript with an index**: performance depends on the JIT (JavaScriptCore and V8 differ: compare the two result sets); GC pauses are possible if the hot paths allocate (they do not: typed arrays, reused buffers); the overview of 100k items is the first place it would run short (1.9 ms of a 16.7 ms frame, before drawing).

### What a WebAssembly engine would need to pass the contract

The 14 tests of `packages/canvas/src/core/engine-contract.ts` are the bar. The crate today owns geometry, the index, hit testing, box selection and culling; to run the suite through `engineContract("Rust", …)` it would also need, behind a TypeScript `CanvasEngine` shell:

- the id ↔ slot table and item data (`data`, `kind` strings) on the JavaScript side, with `get`, `getState().items` (bottom first) and `subscribe` rebuilt from the slots;
- history as patches (undo, redo, gestures that record one step, cancel, coalesced nudges), selection (with locked items skipped by select-all), clipboard and paste offsets, duplicate, bring to front and send to back (z writes, then the lazy order);
- kinds as data (resize rules, `movable`, `selectable`) since the TypeScript kinds hold functions: a declared shape in Rust, with a JavaScript hit test as the slow path for kinds that define their own (D-148 already says so);
- the viewport arithmetic (zoom presets, fit, whole-pixel rounding), `nearest`, `reading-order`, lasso (point in polygon on centers), `handle-at`, `handles`, read-only, and `serialize`/`load` with the version field.

A thin TypeScript shell owning ids, data, history and selection, with the crate answering the spatial queries, is the realistic shape; it is also exactly what the TypeScript engine with an index would look like, which is one more reason to build that first: the shell is shared, and swapping the index for the crate later is local.

## After the fixes (November 19, 2026): the editors on a real GPU

The engine was never the cost in the editors. A diagnosis with GPU traces (headless Chrome on the M4's GPU through ANGLE/Metal, 1,440 × 900 at 2×) put the cost of a pan or zoom step in the DOM around the engine: global sibling selectors in `@forgeron/ui` that restyled the whole canvas each time culling mounted or unmounted an item, culling that churned at every step, a renderer that rewrote the DOM every frame, `<Canvas>` re-rendering on every camera move, and a minimap repainting every item. Fixed in that order:

1. **No universal sibling selectors in ui.** `.fg-avatars > * + *`, `.fg-cmp-row > * + *`, `.fg-fm-sum-top > div + div`, `.fg-fm-nps > div + div`, `.fg-display-layout + *` and `.fg-fbr-slides > i + i` became class selectors (a class on the cells, padding on the avatar stack, the hidden second slide removed). Boxes identical and screenshot hashes identical on the 11 gallery pages that show them.
2. **A cull window with hysteresis** (`cullWindow`, `useCullWindow`): the view plus twice the overscan, kept while the view plus the overscan stays inside it and the zoom has not grown by half. A small pan mounts and unmounts nothing; a long one moves the window in steps.
3. **The DOM renderer writes only what changed**: the size, the transform, the primitives (by identity) and the selection chrome (by what it draws); the grid color is read once, again on a theme change or a resize.
4. **The camera outside React**: `<Canvas>` subscribes to the items, the selection, the tool and the cull window; a store listener moves the world layer and redraws the renderer. No scan of every item per step.
5. **The minimap's items in an offscreen bitmap**, rebuilt when the items, the selection, the colors or the mapping change; a camera move copies it and draws the frame, without rendering.
6. **Flow edges culled** to those whose box (`edgeBounds`) meets the cull window, plus the selected and dragged ones; the insert button rendered only while its edge is hovered or selected (it was `display: none` otherwise).

Tried and not kept: compositing the world layer (`will-change: transform`, with a backing element under the items it stays at 18 layers instead of 1,026) left draw at fit at 5.6 ms a step with more paint (2.4 ms), made zoom slower (7.7 ms, 16 long tasks) and moved pixels of the dither patterns at 50–75 %; dropping `vector-effect: non-scaling-stroke` from flow edges or from draw's far pen strokes changed nothing measurable (±0.1 ms).

Main thread per wheel step, 120 steps per scenario; frame cost p50 / p95; style, layout and paint per step; all in ms; long tasks are main-thread tasks over 12 ms. The draw page has 2,000 items, the flow page 500 nodes and 700 edges; "fit" is the page's opening view (10 %), "100 %" after the `0` key. Before is `98d358e1`; after is the working tree on `de9c93da` (the second of two runs; the first was up to 0.4 ms slower on draw and up to 0.9 ms on flow).

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

## Far-zoom renderer (November 20, 2026)

Below the far zoom (draw 35 %, flow 40 %) the items are no longer DOM: `<Canvas far={{ zoom, kinds, below, keep }}>` asks each kind for primitives (`kinds[kind](item, { selected }) → FarPrimitive[]`: rect, ellipse, diamond, polyline, triangle, one line of text), packs them as 64-byte instances (`core/far.ts`, pure) and draws them on one WebGL2 surface under the DOM items (`react/far-layer.ts`): one instanced call per layer (`below`: flow's edges; `items`: the culled items, then the selection's outlines), six vertices per instance, edges covered by signed distance (no multisampling), a stroke thinner than a device pixel drawn one pixel wide at its share of the color, as the DOM's scaled borders are. A pan or a zoom sets three uniforms; the buffers are rebuilt only when the items, the selection or the cull window change. Without WebGL2, or when its context is lost, a 2D canvas draws the same instances. Colors are tokens or any CSS color (`color-mix` included), resolved on the surface once and again on a theme change. Texts (flow's node names, frame names) go on a 2D canvas a margin larger than the view, moved by a CSS transform on a pan and redrawn on a zoom. Dither fills are a flat wash of their color (40 %), as the DOM's far view drew them: a 4 × 4 pattern of 2-unit pixels is under a screen pixel at these zooms and would alias into moiré. Hit testing is the engine's (`hit`), as before. Near zoom is the DOM, unchanged.

Crossing the threshold: the DOM moves towards what it must hold a few items a frame (the count adapted so a step takes about 6 ms, unmounting four times as many), while the far layer draws the items not mounted yet; `renderItem` learns the view from `state.far`, so mounted items do not re-render at the switch. Flow's DOM edges come back 32, 64, 128… a frame, the far layer drawing all edges until they are there.

Same harness and machine as "After the fixes" (headless Chrome on the M4 through ANGLE/Metal, 1,440 × 900 at 2×, 120 wheel steps). Before is `a5bc6148`, after the working tree; both measured back to back. "cross" starts at 50 % and zooms out to 27 % and back twice (four crossings of draw's 35 % and flow's 40 %). Times in ms. Long tasks are main-thread tasks over 12 ms.

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

Draw at fit is now 2.1 ms a pan step (target 2), of which script 1.06: the minimap rebuilding its bitmap as the view leaves the items (its token colors are now read once per theme), the grid's dots and React when the cull window moves; the far layer itself is a few hundredths. Flow at fit zoom gains less: half of that gesture is above 40 % (it zooms to 110 %), where nodes are rich cards. The GPU does a little more per frame (3.7 → 4 to 5 ms on the GPU thread, a full-screen WebGL canvas redrawn each step), still far from a frame.

Compositor layers stay 16 (draw) and 19 (flow) plus the far canvas at rest; while the DOM catches up after a switch, the items over the WebGL canvas are composited on their own (up to about 110 layers for a few frames).

Screenshots (`scratchpad/far/shots`, 1,440 × 900 at 2×): near zoom is identical to the pixel in the 11 near states of the gallery's canvas, draw and flow pages (opening views, 50 to 200 %, panned; two first-run differences of the canvas page and one pixel at 200 % did not reproduce on a second run); at far zoom the boxes, ellipses, diamonds, stickies and frames match, pen strokes are slightly smoother, flow's names are drawn by the 2D canvas instead of the DOM (slightly brighter at 10 %).

Not done: flow edges are clickable at far zoom only when selected (the DOM keeps those); dashed strokes (draw's dashed arrows, flow's skipped edges) and running edges' marching dashes are solid at far zoom; nothing hovers at far zoom (nothing did); flow's group frames stay DOM, so their 3 % wash now lies over the nodes; images stay DOM; a real GPU other than the M4, VoiceOver, touch.

## Palier 1, step A (November 20, 2026): draw's items on the GPU at every zoom

The owner chose "palier 1" (tier 1) for the editors: FigJam-level performance, 10,000 to 50,000 items fluid at every zoom, the GPU drawing, the DOM only for text being edited and for flow's rich bodies near. Step A puts all of draw's drawing on the GPU at every zoom; text stays DOM (step B moves it to a glyph atlas), flow is step C.

**Design.** `<Canvas far={{ zoom, kinds, keep, overlay }}>`: with `overlay`, the far layer is on at every zoom. Each kind gives its GPU drawing once per item object (`KindSpec.gpu` in draw, `core/gpu.ts` for the shared parts), cached by item, so a camera move packs nothing and a change packs the layer once. The instance grows to 96 bytes (`FAR_STRIDE` 24): dash on, off and start along the path, flags (`crisp`, `chrome`, caps), the pattern's 16 bits, its pixel and density, an image index. The shader works in device pixels: boxes, ellipses and diamonds with the stroke inside the box and centered on the path SVG strokes (the fill reaches that path), coverage by signed distance; `crisp` boxes (rectangles, stickies, frames, pen runs, images) have their edges on whole device pixels, as `shape-rendering: crispEdges`, unless under a device pixel; the 4 × 4 dither is computed per pixel in world space from the world's origin (as the SVG pattern in user space), and drawn as a wash of its density once a pattern pixel is under a device pixel; dashes run along a box from its top-left corner, an ellipse from its right end (arc length by Simpson's rule), a diamond from its top, a polyline continuously across its segments; arrows are butt-ended with their inner joints squared (the miter of an elbow); arrowheads are anti-aliased triangles; pen strokes are their runs of whole pixels (`penRuns`, the same runs as `strokePath`, cached per stroke); images are textures uploaded once loaded, drawn in their place in the order (one instanced call per run between images); frames clip their items by a per-instance clip rectangle; primitives carry a zoom range (a text's wash and a frame's GPU name end at 35 %, where the DOM's words begin). A third layer, `chrome`, draws the selection's outlines, the single selection's handles, the box and the lasso (filled through the stencil, any shape), rounded to screen pixels as the SVG chrome rounded them. The 2D canvas fallback draws the same instances (`setLineDash`, `CanvasPattern` anchored at the world's origin, `drawImage`, an even-odd path for the lasso).

**The DOM text layer.** From 35 % up the DOM holds, in the cull window, only the items whose kind says they show something over the GPU drawing (`KindView.overlay`: a sticky's or a text's words, a shape's label, a frame's name), plus the item being typed (its field) and the selected arrow (its ends); below 35 % it holds nothing but those two. They sit in the world layer, so a pan moves one transform and restyles nothing. A selected item is no longer mounted for its outline. Because every word is above every GPU drawing, each overlay is cut (`clip-path: path(evenodd, …)`, `overlayClip`) where an opaque box lies above it in the order (`KindSpec.opaque`: stickies, images, solid rectangles); the boxes are split into disjoint cells, so overlaps stay hidden. When the cull window grows by more than 16 overlays at once (a zoom out), the DOM catches up a few a frame, as at the far/near switch. Hit testing, pointer handlers and the engine contract are unchanged. `paint` and the exports are unchanged; `KindSpec.far` and its golden stay as they were.

**Parity** (1,440 × 900 at 2×, the demo board, same viewports before and after; differing pixels over 5.18 M):

| area                                   |             100 % |           200 % | where it differs and why                                                                                                                  |
| -------------------------------------- | ----------------: | --------------: | ----------------------------------------------------------------------------------------------------------------------------------------- |
| evidence (images, captions, stickies)  |                 0 |               0 | identical                                                                                                                                 |
| roadmap (rectangles, dashed arrows)    |    5,462 (0.11 %) |  2,051 (0.04 %) | a dashed arrow under a label: the label's words are now over it                                                                           |
| journey (rectangles, elbows, pen)      |    7,857 (0.15 %) |  4,243 (0.08 %) | anti-aliasing of diagonal arrows and arrowheads                                                                                           |
| architecture (boxes, arrows, pen ring) |   16,991 (0.33 %) | 13,710 (0.26 %) | diagonal and dashed diagonal arrows (anti-aliasing, dash phase on a diagonal), arrowheads                                                 |
| clusters (overlapping stickies, pens)  |   43,758 (0.84 %) | 34,711 (0.67 %) | words over pen strokes and arrows drawn above them, and those strokes' diagonals; overlapping stickies hide each other's words, as before |
| dot voting (stickies, ellipses)        |    57,782 (1.1 %) |               – | the ellipses' anti-aliased edges (delta ≤ 77)                                                                                             |
| metrics                                | 975,461 (delta 1) |               – | translucent fills: one level of 255 in the premultiplied alpha                                                                            |

Rectangles, stickies, frames and their clipping, pen strokes, horizontal and vertical arrows (solid and dashed), dither patterns and images are identical at 100 % and 200 %. The selection chrome is identical (outline, handles, box); the lasso's fill is identical, its diagonal edge differs by anti-aliasing. Under 35 % the look changes on purpose: patterns are their density instead of a 40 % wash, diamonds have their border, pen strokes are their pixels, stickies their edge. At 40 % (a pattern pixel is 1.6 device pixels) the hatch is sampled per pixel where SVG resamples its tile. Screenshots: `scratchpad/pa-run/shots`.

**Numbers.** Same harness and machine as "Far-zoom renderer" (headless Chrome on the M4 through ANGLE/Metal with `--use-angle=metal --enable-gpu-rasterization --ignore-gpu-blocklist`, 1,440 × 900 at 2×, 120 wheel steps; "cross" zooms out from 50 % to 27 % and back twice). Before is `58c00b0f`, after the working tree on it, both built and measured back to back. Main thread per wheel step; frame cost p50 / p95; GPU thread per step; all in ms; long tasks are main-thread tasks over 12 ms.

| page, gesture           | main/step before → after | frame p50 / p95 before → after | GPU thread | long tasks (max ms) |
| ----------------------- | -----------------------: | -----------------------------: | ---------- | ------------------- |
| board fit, pan          |                2.2 → 2.4 |          3.8 / 7.2 → 4.0 / 9.0 | 4.6 → 5.8  | 0 → 0               |
| board fit, zoom         |                3.2 → 3.5 |         4.7 / 9.2 → 5.1 / 11.0 | 5.1 → 6.3  | 0 → 0               |
| board 100 %, pan        |                2.4 → 2.5 |         3.3 / 12.6 → 3.8 / 9.8 | 3.3 → 4.7  | 0 → 0               |
| board 100 %, zoom       |                3.4 → 3.5 |         5.4 / 15.8 → 5.7 / 9.3 | 2.8 → 4.7  | 2 (19) → 0          |
| board cross             |            6.0 → **4.1** |        8.0 / 17.6 → 6.2 / 11.9 | 5.4 → 5.6  | 2 (22) → 0          |
| 2,000 items fit, pan    |                2.2 → 1.8 |          3.8 / 6.9 → 3.3 / 6.0 | 4.0 → 4.5  | 0 → 0               |
| 2,000 items fit, zoom   |                3.7 → 3.3 |         5.3 / 12.7 → 5.3 / 8.7 | 9.5 → 4.6  | 0 → 0               |
| 2,000 items 100 %, pan  |            3.1 → **2.4** |        5.1 / 12.3 → 3.6 / 10.2 | 2.6 → 3.9  | 0 → 0               |
| 2,000 items 100 %, zoom |            4.6 → **3.2** |         5.7 / 26.9 → 5.3 / 9.1 | 2.9 → 3.9  | 12 (24) → 0         |
| 2,000 items cross       |            7.2 → **4.0** |       11.3 / 23.8 → 6.2 / 14.3 | 3.8 → 4.3  | 6 (26) → 0          |

At 4× CPU throttling:

| page, gesture           | main/step before → after | frame p50 / p95 before → after | long tasks (max ms) |
| ----------------------- | -----------------------: | -----------------------------: | ------------------- |
| board fit, pan          |                3.5 → 3.4 |        6.0 / 12.9 → 5.7 / 10.8 | 0 → 0               |
| board fit, zoom         |                6.7 → 6.7 |      11.2 / 18.2 → 11.1 / 18.8 | 0 → 1 (13)          |
| board 100 %, pan        |                3.6 → 3.4 |        5.4 / 20.1 → 5.2 / 17.6 | 4 (14) → 0          |
| board 100 %, zoom       |                7.3 → 7.2 |      11.0 / 40.1 → 11.2 / 20.4 | 15 (56) → 1 (13)    |
| board cross             |           15.4 → **9.5** |      26.6 / 79.5 → 15.8 / 31.4 | 61 (72) → 17 (23)   |
| 2,000 items fit, pan    |                3.2 → 3.3 |        5.7 / 10.0 → 5.6 / 12.3 | 0 → 0               |
| 2,000 items fit, zoom   |                7.0 → 7.6 |      10.8 / 16.3 → 12.1 / 18.0 | 0 → 0               |
| 2,000 items 100 %, pan  |            6.7 → **3.4** |       10.9 / 24.7 → 5.1 / 15.0 | 9 (15) → 0          |
| 2,000 items 100 %, zoom |            9.8 → **7.2** |      11.6 / 97.3 → 12.3 / 20.4 | 20 (77) → 1 (13)    |
| 2,000 items cross       |          17.2 → **10.8** |       91.9 / 141 → 16.2 / 31.2 | 46 (79) → 18 (18)   |

Gestures (main-thread tasks over 12 ms over the gesture; rAF interval p95): select all and drag 60 steps on the board at 100 %, 60 (max 73) → 1 (14), rAF p95 50 → 16.7 ms; on the 2,000 items at 100 %, 62 (max 207) → 0, p95 183 → 16.7; on the board at fit, 2 → 2. Typing 40 characters into a sticky at 100 %: 1 (18) → 0. At 4×: drag at 100 % 63 (max 274) → 61 (max 48), rAF p95 233 → 33; on the 2,000 items 61 (max 874) → 55 (max 27), p95 833 → 16.8; at fit 61 (47) → 61 (53); typing 40 (max 44) → 36 (max 24).

Normal CPU: no frame above 16 ms at p95 and no long task in any pan or zoom. At 4×: no long task in pan; one of 13 ms in some zooms; the threshold crossing keeps 17–18 tasks of about 20 ms, which are the DOM words mounting as the window grows (layout and paint of a few hundred text boxes): step B removes them. The GPU thread does about 1 ms more a frame (a full-screen canvas, patterns per pixel), 3 to 6 ms, far from a frame. Dragging a selection of 2,618 items at 4× repacks the whole layer each step (about 20–25 ms of script); packing only the moved items' instances is the next lever.

Not done in step A: words are above every GPU drawing (cut only by opaque boxes: a pen stroke or an arrow drawn above a sticky shows its words over it); the bind and erase highlights and the pen's preview stay a small `WorldSvg` while a gesture runs; nothing hovers (nothing did). What steps B and C need from this: B, the glyphs as a fourth instance kind (or a textured `runs`) in the same packs, so the overlay's words and their occlusion go; the zoom ranges are there for a text's levels of detail. C, flow's kinds through `gpu` and `overlay` (rich bodies are overlays near), its edges with the dashes and caps of `line`, and the DOM overlay held only for focus and the accessibility tree (the listbox now holds only overlays, the focused item and `keep`; a screen reader's list of items must come from the engine instead).

## Palier 1, step B (November 20, 2026): draw's words on the GPU

Step B draws every word of draw on the GPU, from an atlas of glyphs, in the order of the drawing; the DOM holds only the field being typed (and the selected arrow's ends).

**The font.** The owner's plan spoke of the bitmap pixel fonts, but draw's words are not set in one: stickies, labels and texts are Geist (`--font-sans`, 400, line-height 1.4), frame names Geist Mono 11/16, both vector faces loaded from Google Fonts. Forgeron Sans (`@forgeron/font`) has glyph bitmaps, but setting the board in it would change its look, which is the owner's call, not a performance step's. So the atlas is built from the font the DOM uses, rasterized by the browser's own rasterizer (a 2D canvas `fillText`) at the size each glyph takes on screen: the most faithful route, and the one that gives the DOM's pixels. Moving the board to Forgeron Sans later only changes where the atlas's cells come from (its rows, at whole pixels).

**Design.** A new primitive, `glyphs` (`@forgeron/canvas`, `core/far.ts`): lines of text laid out by the caller, a font (`family`, `size`, `weight`), a color, a line height, a zoom range and, under `minSize` screen pixels, a greeked bar (`greek`) or nothing. It packs as one 96-byte instance per glyph in the same packs as the rest (`FAR_KIND.glyph`): its pen's x, its line's top, its font size, its glyph id, its baseline; so a word lies where it belongs in the order, and what is drawn above it hides it (the step A limit, words over strokes drawn above them, is gone). Layout is pure (`core/text.ts`: `wrapText`, `placeLine`, `ellipsize`, `clusters`) on `FarTextMetrics` (`advance`, `kern`, `baseline`): the DOM's rules for `pre-wrap` and `overflow-wrap: anywhere` (hard breaks; breaks after spaces, which hang; after a hyphen not before a figure, after an en dash, around an em dash; a word longer than a line broken at the edge), kerning by pairs, the f-ligatures (`ff fi fl ffi ffl`) kept whole as one cluster so a ligature is drawn as the DOM draws it. The browser's metrics (`textMetrics(el)` of `@forgeron/canvas/react`, one per document) read advances and pair kerning from a 2D canvas, the baseline from a line box the DOM lays out, and lay everything out again when a web font finishes loading. Draw installs them (`setTextMetrics`) and lays out with them: the words on the GPU (`gpuText` in `core/gpu.ts`: sticky 12 in, label centered 8 in (top-aligned once it overflows, as the label's grid does), text at its alignment, frame name in mono with its ellipsis), the heights of stickies and texts as they are typed (the layout, not the field's `scrollHeight`), and `paint` and the exports (`textLines`). Without metrics (tests, a server) the estimate stands, so `paint`, the draw golden and `far` with its golden are unchanged.

The atlas (`react/glyph-atlas.ts`): one entry per font, size and cluster, rasterized white on transparent at the device size of the moment in four quarter-pixel phases, side by side; a float table, a row per 256 glyphs, says where each one is, read by id in the vertex shader, so a zoom changes the table and never the instances. At a size rasterized exactly, a glyph lands on whole device pixels at the phase of its pen (Skia's rounding: the nearest quarter, the baseline on the nearest row), and the line's top on a device pixel of the unscaled page, as the DOM lays it out before its layer is scaled. While the zoom moves, glyphs are drawn at a rung of a quarter-octave ladder (one phase), and a cell within a fifth of the size is kept and scaled; 150 ms after the zoom rests, the exact size comes, 2 ms of rasterizing a frame at most (missing glyphs first, better sizes after), the rest the next frames. Glyphs are drawn on a small canvas that sits, hidden, in the surface's element: it inherits `-webkit-font-smoothing: antialiased` from the page, without which canvas text is bolder than the DOM's. A run of cells is sent to the texture in one `texSubImage2D` from that canvas. Each `glyphs` primitive's instances are kept once packed (`FarGlyphSource.cache`, by primitive), so a pack copies the words of an unchanged item instead of laying them out again. The 2D canvas fallback draws the same glyph instances with `fillText` at their pen and baseline.

Levels of detail: words are drawn from 35 % up (stickies, labels, texts), as the DOM showed them; a text keeps its wash below; a frame's name is drawn down to a font size of one screen pixel and is a bar of its width below. In draw's editor half, the built-in kinds no longer have an `overlay`: the DOM holds the item being typed, and the GPU leaves that item's words out (`FarDraw` gets `kept`, `KindSpec.gpu` gets `{ words: false }`). `KindView.overlay` stays for kinds that need DOM content over their drawing.

**Parity** against step A (which drew words in the DOM), same viewports, 1,440 × 900 at 2×; differing pixels over 5.18 M, and those differing by more than 2 levels of 255:

| area                                   |                 100 % (over 2) | 200 % (over 2) | where it differs and why                                                                                 |
| -------------------------------------- | -----------------------------: | -------------: | -------------------------------------------------------------------------------------------------------- |
| evidence (images, captions, stickies)  |                          0 (0) |          0 (0) | identical                                                                                                |
| journey (labels, elbows, pen)          |                    2,933 (346) |        696 (0) | 100 %: one glyph a quarter phase off; the rest one level of 255 over translucent fills                   |
| roadmap (labels, dashed arrows)        |                    5,397 (382) |      1,891 (0) | dashed arrows drawn above a label now cross its words (the order); 100 %: two glyphs a quarter phase off |
| architecture (boxes, arrows, pen ring) |                    2,257 (112) |    1,865 (663) | one glyph a quarter phase off; words under the arrows drawn above them                                   |
| clusters (overlapping stickies, pens)  |                 40,688 (3,158) | 31,826 (4,708) | pen strokes, arrows and stickies drawn above words now cover them (the order)                            |
| dot voting (stickies, ellipses)        |                    53,539 (49) |              – | one glyph ("tt"); the rest one level of 255 over the stickies' paper                                     |
| metrics                                |                      1,133 (0) |              – | one level of 255                                                                                         |
| 40 %, two areas                        | 88,997 (4,303) and 8,830 (189) |              – | the order; glyphs rasterized at a fractional size differ by a few levels (titles: ≤ 5)                   |
| fit, 20 %                              |                39 (15), 59 (0) |              – | the minimap                                                                                              |

What is identical: every word of the evidence area at 100 and 200 %, stickies' words (top-aligned, several lines), text items, labels at 200 % (one level of 255 where words lie over translucent fills: the DOM composites them in its layer, the GPU in the surface). Where they differ and why: the order (a pen stroke, an arrow or a sticky drawn above a word now covers it: cluster, roadmap, 40 %); one glyph in a few hundred lands a quarter phase off (a pen position at a tie between two phases: the DOM sums HarfBuzz's advances, the layout canvas `measureText`'s); at a fractional zoom (40 %) glyphs rasterized at a fractional size differ by a few levels at most. Screenshots: `scratchpad/pb-run/shots`.

**Numbers.** Same harness and machine as step A, before is step A (`b0d603b5`), after the working tree on it, built and measured back to back. Main thread per wheel step; frame cost p50 / p95; GPU thread per step; all in ms; long tasks are main-thread tasks over 12 ms.

| page, gesture           | main/step before → after | frame p50 / p95 before → after | GPU thread   | long tasks (max ms) |
| ----------------------- | -----------------------: | -----------------------------: | ------------ | ------------------- |
| board fit, pan          |                1.8 → 2.7 |          2.9 / 5.1 → 4.8 / 7.8 | 4.18 → 7.82  | 0 → 0               |
| board fit, zoom         |                5.1 → 3.5 |        7.6 / 14.1 → 5.8 / 12.7 | 11.32 → 7.98 | 0 → 0               |
| board 100 %, pan        |                2.3 → 2.6 |          3.4 / 8.9 → 4.1 / 8.5 | 4.92 → 7.21  | 0 → 0               |
| board 100 %, zoom       |                4.2 → 3.8 |        6.2 / 11.6 → 6.7 / 11.9 | 4.96 → 6.68  | 0 → 0               |
| board cross             |                5.2 → 3.4 |         7.4 / 13.9 → 5.8 / 9.9 | 6.15 → 4.99  | 0 → 2 (15)          |
| 2,000 items fit, pan    |                2.7 → 2.4 |            4.4 / 8.5 → 4.2 / 8 | 9.41 → 5.15  | 0 → 0               |
| 2,000 items fit, zoom   |                6.2 → 3.2 |         8.8 / 15.5 → 5.8 / 9.3 | 10.22 → 5.48 | 0 → 0               |
| 2,000 items 100 %, pan  |                1.6 → 2.3 |            2.4 / 5.1 → 3.9 / 7 | 4.77 → 12.36 | 0 → 0               |
| 2,000 items 100 %, zoom |                2.6 → 3.4 |         4.1 / 7.8 → 5.8 / 12.7 | 4.61 → 7.44  | 0 → 0               |
| 2,000 items cross       |                4.5 → 2.8 |         5.8 / 12.9 → 5.2 / 8.1 | 5.48 → 3.78  | 0 → 0               |

At 4× CPU throttling:

| page, gesture           | main/step before → after | frame p50 / p95 before → after | GPU thread  | long tasks (max ms) |
| ----------------------- | -----------------------: | -----------------------------: | ----------- | ------------------- |
| board fit, pan          |               10.6 → 5.5 |       19.3 / 36.4 → 9.5 / 18.1 | 7.64 → 5.28 | 24 (25) → 3 (14)    |
| board fit, zoom         |               15.8 → 9.1 |        38.8 / 65.8 → 15 / 36.5 | 6.13 → 7.36 | 82 (33) → 17 (28)   |
| board 100 %, pan        |                6.3 → 4.5 |        9.2 / 25.8 → 7.7 / 14.4 | 5.1 → 4.93  | 7 (18) → 1 (18)     |
| board 100 %, zoom       |               13.9 → 9.9 |      23.2 / 62.4 → 18.6 / 31.4 | 4.43 → 5.02 | 53 (43) → 20 (37)   |
| board cross             |               13.1 → 9.1 |      19.5 / 38.8 → 14.5 / 32.4 | 6.92 → 6.49 | 34 (22) → 12 (37)   |
| 2,000 items fit, pan    |                5.4 → 4.4 |        9.1 / 17.1 → 7.3 / 16.4 | 5.19 → 3.68 | 3 (13) → 1 (16)     |
| 2,000 items fit, zoom   |                8.6 → 8.7 |      13.4 / 19.3 → 14.7 / 30.7 | 4.8 → 4.31  | 0 → 14 (28)         |
| 2,000 items 100 %, pan  |                4.8 → 4.5 |        7.7 / 19.1 → 8.4 / 14.9 | 4.2 → 3.17  | 1 (12) → 0          |
| 2,000 items 100 %, zoom |                9.0 → 8.0 |        14.3 / 24 → 14.4 / 25.6 | 4.2 → 4.46  | 6 (14) → 6 (15)     |
| 2,000 items cross       |               11.6 → 7.3 |      19.2 / 30.3 → 12.9 / 22.7 | 3.07 → 4.02 | 28 (20) → 4 (16)    |

Gestures (main-thread tasks over 12 ms over the gesture, rAF interval p95), before → after: select all and drag 60 steps on the board at 100 %, 1 (16) → 1 (14), 16.7 → 16.7 ms; at fit, 3 (20) → 4 (19); on the 2,000 items at 100 %, 0 → 2 (14); typing 40 characters into a sticky at 100 %, 1 (14) → 0. At 4×: drag at 100 % 61 (max 66) → 60 (max 57), p95 33.5 → 33.4; at fit 61 (59) → 61 (64), p95 50 → 50; on the 2,000 items 60 (37) → 60 (43); typing 40 (max 31) → 36 (max 29). A first version laid every text out again on each step of a drag (the items are new objects): 60 tasks of 25–40 ms at fit, 100–130 ms at 4×; layouts are now kept by text, width and font (`layoutLines`), and placed glyphs by primitive.

Caveat: the machine was busy during these runs (another browser drawing on the GPU, load average about 5): the same build measured twice gave 19 then 78 long tasks at 4× on "board 100 %, zoom". Before and after were run back to back, and the comparison holds within a run; the absolute numbers are higher than step A's for the same code.

Where it stands. Normal CPU: no long task in any pan or zoom but two of 15 ms in one crossing run; the crossing of 35 % goes from 5.2 to 3.4 ms a step on the board and 4.5 to 2.8 on the 2,000 items, as the DOM no longer mounts words. At 4×: long tasks fall in every gesture of the board (fit zoom 82 → 17, 100 % zoom 53 → 20, crossing 34 → 12, 2,000 items crossing 28 → 4) but are not gone: the target (none in pan and zoom at 4×, the crossing included) is not met. What is left is script: packing the layer again when the cull window moves (now with the glyph instances, copied from the cache: about 70,000 glyphs on the whole board), rasterizing glyphs (2 ms a frame), and the first layout of the words of a board seen whole as it crosses 35 % (budgeted at 3,000 glyphs a pack, the rest the next frames, words appearing over a few frames). Packing only what changed, kept per item in the buffer, is the lever, as step A noted for drags. The GPU thread does about the same (glyphs out of their zoom range are not in the pack).

Not done in step B: Forgeron Sans as the board's face (the owner's call; the atlas would then come from the glyph table at whole pixels); ligatures other than the f ones, combining marks, emoji and right-to-left text (clusters are code points; the DOM shapes them); an occasional glyph a quarter phase off; the 2D fallback draws glyphs by `fillText` per glyph, slow on a full board; the accessibility tree: the DOM no longer holds any word, so the listbox holds the focused item and `keep` only, and a screen reader's list of items must come from the engine (step C); flow's names still go on the 2D text canvas above the layer (step C: through `glyphs`). For step C: flow's node and edge labels through `glyphs` and `wrapText` (the same metrics), its rich bodies as DOM overlays near, `kept` for the node being edited; an offscreen list of the items in the cull window, with their words, for assistive technology; packing per item into a persistent buffer, so a cull window move or a drag repacks what changed.

## Palier 1, step C (20/11/2026): packing per item, flow on the GPU, the items for assistive technology

Step C makes a change cost what it touches, puts flow on the GPU at every zoom, and gives assistive technology the items the DOM no longer holds.

**Packing per item** (`core/far-buffer.ts`, `createFarBuffer`, pure). Each layer of the far layer is a buffer of groups (`FarGroup`, `{ key, prims, dx?, dy? }`: an item's drawing, an edge, a selection outline) laid out in drawing order, each group in its own range with a little room to grow (an eighth, plus one), padded with instances no zoom draws. An update packs only the groups whose primitives changed and writes them in place (the GPU gets `bufferSubData` of their ranges); a group drawn the same but moved (`farMoved`: every position, `x`, `y`, `points`, `lines`, `clip`, translated by one offset, everything else equal, compared without allocating) is not packed at all: its offset goes into a small `RG32F` texture (one texel per group slot; float 24 of an instance says which, so `FAR_STRIDE` is 25) that the vertex shader adds to its positions, the 2D fallback too. A caller that knows a drawing only moved says so (`dx`, `dy`): the canvas does for the selection's outlines, one group per selected item. A group that comes or goes moves the others by copying their packed instances (a group that left is kept packed, up to 4,096, and comes back without packing when the cull window returns to it); a new stacking order lays out again by copies; groups that left only free their instances. Glyph ids are counted per group, so the atlas is asked only for the glyphs of what is in the layer; a zoom that brings words in or out of their range packs again only the groups that hold them, and the glyph budget (3,000 a frame) is shared by the groups of one update. The canvas gives the items layer one group per item (cached per item object), the chrome one per selected item plus one for the handles, box and lasso. The 2D text canvas is gone: a `text` primitive is drawn as glyphs (`lineHeight`, `baseline`). Also: the minimap moves and scales its bitmap while the items or its mapping change (a drag, a pan at fit, where the view is part of what it fits) and draws it exactly at most every 120 ms; `ZoomControls` and draw's interface slots are memoised (a drag re-rendered the dock's tooltips each step).

**Flow on the GPU at every zoom.** With the `far` plugin (`full` preset), `<FlowCanvas>` gives the canvas `overlay` and `chromeOverDom`: near, every node in view is its DOM card with its ports (the GPU draws nothing under a mounted card: kinds now get `shown`, so a translucent card, a skipped step, shows what is under it as before), the selection's outlines, handles, box and lasso stay over the DOM; from far, nodes are labelled boxes on the GPU with their ports, the handled mark, a dashed border when skipped, names through `glyphs` with the canvas's text metrics, cut with an ellipsis (`ellipsize`). Every edge is one canvas group at every zoom (cached while its path and look stay, so moving a node repacks its edges only): its line (1.5 units, 2 hovered or selected), dashed when skipped (3 on 4), marching dashes while it runs (`FarLine.march`, 4 on 8 at 20 units a second, a `u_time` uniform and a frame at a time while some show, still under reduced motion), its arrowhead when the `edge-arrows` plugin is there; bezier curves flattened every 8 units or so (6 to 48 segments) and joined end to end (`joins: "butt"`: a square joint would double a translucent stroke), elbows mitred. Group frames and their labels are GPU groups too. The pointer finds an edge by its shape at every zoom (`edgeAt`: 6 screen pixels of reach, the old invisible stroke's), and a group's label by its box: a press selects the edge (or the group's nodes) instead of starting a box; hover highlights the edge, and the DOM then holds only its parts (the "+", and when selected the reconnect handle; while its end is dragged the GPU draws it grey and dashed). Unselected edges are clickable at far zoom, which was the known gap. Without the `far` plugin everything is DOM, as before.

**The items for assistive technology.** When the GPU draws the items (`overlay`, or below the far zoom), the canvas mounts an offscreen listbox instead of the DOM items' options: the items in the cull window (at most 200, the nearest the view's centre when there are more), plus the active item and up to 20 selected ones out of the window, in reading order (rows, then columns); each option named by `itemLabel` (draw: the kind and its words; flow: the node's name and run state) and described by `itemRole` (`aria-roledescription`). The surface keeps the focus; its `aria-activedescendant` is the active item: the focused one while it is selected, else the last selected, so it follows a click, ⌘A, Tab and Shift+Tab (which select as before), Alt + arrows, and Escape clears it. The focused item needs no DOM of its own. The existing tests are unchanged (a canvas without GPU items keeps the listbox of DOM options); new ones check the list's content, its culling, the active descendant and the keys.

**Parity.** Draw is identical to the pixel at every area and zoom of step B's set (16 shots, 0 differing pixels): packing per group and offsets change nothing drawn. Flow against `b30cfbcd` (1,440 × 900 at 2×, the order-to-cash demo with its last run frame; differing pixels over 5.18 M, and those differing by more than 2 levels of 255):

| area                                  |                                         100 % |           200 % | where it differs and why                                                                                                                                         |
| ------------------------------------- | --------------------------------------------: | --------------: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| intake (merge, branches, curves)      |                                73,176 (2,591) |   1,639 (1,579) | edges' anti-aliasing (signed distance against SVG's `geometricPrecision`), within a few levels along their length; group frame washes, one level                 |
| approvals (switch, branches, retries) |                                14,538 (9,502) |  13,506 (9,901) | the same: curved and skipped edges' anti-aliasing                                                                                                                |
| SDI retry (handled failure, retries)  | 738,607 (8,835); 844,417 (143,277) at load 14 | 231,003 (4,700) | edges' anti-aliasing, group washes by one level; the run at load 14 caught the cards still mounting after the jump to the area (labelled boxes for a few frames) |
| DE error (failed, skipped steps)      |                              567,450 (17,037) | 647,691 (2,022) | group washes by one level; skipped (dashed) edges' dash phase and anti-aliasing under translucent cards                                                          |

At 40 % (cards near): 216,365 (22,014) and 252,777 (32,928), the edges' anti-aliasing at a stroke of 1.2 device pixels. Far (20 %, fit): the boxes, names and edges match the old far view but for what step C adds on purpose: skipped steps' borders dashed and skipped edges dashed (they were solid on the GPU, dashed in the DOM's far view), ports drawn, names cut by the canvas's metrics (one glyph more fits in some boxes than with the old 2D canvas's measure). Screenshots: `scratchpad/pc-run/shots` (`f0`/`f3`, `s0`/`s3`).

**Numbers.** Same harness and flags as steps A and B (headless Chrome, `--use-angle=metal --enable-gpu-rasterization --ignore-gpu-blocklist`, 1,440 × 900 at 2×, 120 wheel steps; "cross" zooms out from 50 % to 27 % and back twice, which crosses draw's 35 % and flow's 40 %); before is `b30cfbcd`, after the working tree on it, built and measured back to back, three times. The machine was busy (another session building and drawing; load average 4 to 14 during the runs, noted per phase), and the same build differs between runs by more than most of the differences below: the tables are the last run (load 5–8 at normal CPU, 14 at 4×), the gestures give all three. Main thread per wheel step; frame cost p50 / p95; GPU thread per step; long tasks are main-thread tasks over 12 ms.

| page, gesture             | main/step before → after | frame p50 / p95 before → after | GPU thread  | long tasks (max ms) |
| ------------------------- | -----------------------: | -----------------------------: | ----------- | ------------------- |
| board fit, pan            |                2.0 → 1.6 |          3.1 / 7.2 → 2.0 / 7.7 | 4.86 → 5.86 | 2 (24) → 0          |
| board fit, zoom           |                3.1 → 2.8 |        5.1 / 12.3 → 4.3 / 11.4 | 7.0 → 7.06  | 0 → 0               |
| board 100 %, pan          |                1.8 → 2.0 |          2.8 / 6.6 → 2.9 / 6.5 | 5.69 → 4.11 | 0 → 0               |
| board 100 %, zoom         |                3.3 → 3.2 |        5.9 / 11.3 → 5.0 / 14.4 | 6.01 → 4.61 | 0 → 2 (14)          |
| board cross               |                2.5 → 2.3 |          3.8 / 8.4 → 3.4 / 7.6 | 6.9 → 5.17  | 0 → 0               |
| 2,000 items fit, pan      |                2.2 → 1.9 |          3.6 / 6.7 → 2.4 / 9.0 | 5.13 → 5.43 | 0 → 0               |
| 2,000 items 100 %, zoom   |                2.8 → 2.0 |          5.1 / 7.9 → 3.5 / 5.9 | 4.27 → 3.05 | 0 → 0               |
| 2,000 items cross         |                2.6 → 1.9 |          4.5 / 6.6 → 3.3 / 5.9 | 4.33 → 3.08 | 0 → 0               |
| order-to-cash fit, pan    |                1.9 → 1.6 |          3.4 / 5.1 → 2.4 / 4.9 | 4.68 → 3.03 | 0 → 0               |
| order-to-cash fit, zoom   |                3.8 → 2.9 |         6.4 / 10.9 → 4.5 / 8.4 | 5.0 → 3.78  | 0 → 0               |
| order-to-cash 100 %, pan  |                2.3 → 1.3 |          4.0 / 5.6 → 2.0 / 4.6 | 3.08 → 2.9  | 0 → 0               |
| order-to-cash 100 %, zoom |                3.1 → 2.9 |        5.0 / 12.3 → 4.3 / 10.0 | 2.73 → 4.16 | 0 → 0               |
| order-to-cash cross       |                3.4 → 2.9 |         5.5 / 11.8 → 4.5 / 8.3 | 3.95 → 5.83 | 0 → 0               |
| 2,000 nodes fit, pan      |                1.6 → 2.3 |          2.9 / 4.2 → 3.3 / 7.6 | 5.31 → 7.81 | 0 → 0               |
| 2,000 nodes fit, zoom     |                3.6 → 3.1 |        6.5 / 12.2 → 4.4 / 11.3 | 6.7 → 9.97  | 0 → 1 (17)          |
| 2,000 nodes 100 %, pan    |                2.2 → 2.4 |          3.9 / 8.3 → 4.1 / 7.1 | 2.09 → 10.2 | 0 → 0               |
| 2,000 nodes 100 %, zoom   |                3.7 → 4.0 |        5.2 / 16.2 → 6.5 / 12.8 | 3.26 → 6.8  | 3 (17) → 0          |
| 2,000 nodes cross         |                5.4 → 4.2 |        7.3 / 17.1 → 4.6 / 13.6 | 5.63 → 10.7 | 4 (21) → 0          |

At 4× CPU throttling (load about 14 for both builds):

| page, gesture             | main/step before → after | frame p50 / p95 before → after | long tasks (max ms) |
| ------------------------- | -----------------------: | -----------------------------: | ------------------- |
| board fit, pan            |                8.0 → 7.6 |       13.7 / 29.2 → 9.6 / 43.9 | 7 (19) → 15 (29)    |
| board fit, zoom           |              13.8 → 11.1 |      26.5 / 60.9 → 17.9 / 53.0 | 52 (59) → 36 (53)   |
| board 100 %, zoom         |              10.2 → 12.7 |      18.1 / 30.4 → 20.0 / 73.9 | 28 (43) → 41 (68)   |
| 2,000 items fit, zoom     |              11.4 → 15.3 |      20.4 / 35.2 → 30.8 / 74.0 | 25 (35) → 64 (48)   |
| 2,000 items 100 %, pan    |                5.9 → 5.1 |        9.5 / 18.1 → 8.2 / 19.6 | 1 (14) → 0          |
| order-to-cash 100 %, zoom |              13.5 → 11.4 |      25.1 / 89.1 → 18.6 / 44.9 | 40 (56) → 34 (32)   |
| order-to-cash cross       |              14.9 → 12.8 |      31.1 / 78.8 → 19.8 / 49.0 | 65 (43) → 43 (27)   |
| 2,000 nodes fit, pan      |                9.3 → 6.0 |       13.3 / 26.1 → 8.4 / 27.8 | 8 (134) → 9 (19)    |
| 2,000 nodes fit, zoom     |              15.9 → 10.9 |      37.6 / 84.6 → 17.5 / 40.9 | 71 (49) → 33 (59)   |
| 2,000 nodes cross         |              15.1 → 13.6 |      31.1 / 96.6 → 20.4 / 53.5 | 50 (75) → 40 (30)   |

The draw rows at 4× disagree between runs (the previous run had board fit zoom 22 → 24 and board 100 % zoom 8 → 7, 2,000 items fit zoom 2 → 9): at load 14 the after build ran last, and its pans and zooms at 4× are within the noise of the before build's, not a gain. A profile of a pan at fit at 4× after the fix shows no step heavier than about 5 ms of script, spread over the minimap's blit, the dot grid and React; the long tasks there are the crisp minimap redraw every 120 ms and the cull window moving (copies), landing on the same frame.

Gestures (main-thread tasks over 12 ms over 60 steps; three runs, before → after):

| gesture                                        | normal CPU                           | 4× CPU                                                             |
| ---------------------------------------------- | ------------------------------------ | ------------------------------------------------------------------ |
| draw, select all and drag, board 100 %         | 0, 2, 6 → 1, 0, 1                    | 62, 61, 60 (max 46–49) → 54, 51, 62 (40–50)                        |
| draw, select all and drag, 2,000 items 100 %   | 0, 1, 3 → 0, 0, 0                    | 60, 60, 62 (max 32–74) → 14, 21, 46 (27–43)                        |
| draw, select all and drag, board fit           | 3, 6, 4 → 7, 2, 1                    | 60, 61, 61 → 61, 61, 61                                            |
| draw, typing 40 characters                     | 1, 1, 0 → 0, 0, 0                    | 35, 40, 40 → 2, 27, 8                                              |
| flow, select all and drag, order-to-cash 100 % | 16, 16, 16 → 0, 0, 13                | 60, 61, 62 (max 66–71) → 37, 38, 52 (31–55)                        |
| flow, drag a group (16 nodes), 100 %           | 0, 0, 0 → 0, 0, 0                    | 16, 15, 36 → 26, 18, 19                                            |
| flow, select all and drag, 2,000 nodes fit     | 58, 61, 57 → 1, 1, 1                 | 61, 61, 61 (max 98–164) → 1, 1, 1; rAF p50 50 → 16.7               |
| flow, select all and drag, 2,000 nodes 100 %   | 61, 61, 61 (max 61–102) → 18, 26, 32 | 66, 65, 69 (max 326–395) → 60, 60, 61 (121–150); rAF p95 283 → 100 |

Where it stands. Packing is no longer what a drag or a cull window move costs: a select-all drag of 2,618 items packs nothing (the profile at 4× went from tasks of 22–30 ms a step, about 4 of them packing and the outlines, to 12–19 with none; on 2,000 items the long tasks at 4× fell from 60 to 14–46), and flow's drags gain the most (2,000 nodes at fit: 61 long tasks to 1 at 4×, the frame at 16.7 ms). The target, no long task at 4× in a select-all drag of 2,000 items, is not met: what is left a step at 4× is draw's own engine rules (arrows following, frames settling: about 4.5 ms), the canvas store's commit and React's render of the editor and the inspector (about 4 ms), and the step's selection outlines (1 ms); flow at 100 % on 2,000 nodes is its edges' geometry, recomputed for every edge on each step of a move (the DOM did the same), and its cards. The GPU thread does more for flow near (2 → 7–10 ms a step at 2,000 nodes, every edge an instanced line in the buffer whatever the view); still under a frame. Normal CPU: no long task in pan, zoom or crossing but three single ones (≤ 17 ms).

Not done in step C: edge labels (flow draws none today; the glyph path is there); the edges' names for assistive technology (they were `aria-label`s on DOM paths, not focusable; edges are not in the offscreen list) and the group labels' buttons (a press still selects); the edge under the pointer is found by a scan of the edges' boxes (fine at 2,800); edges are in the buffer whether in view or not (culling them by the window is the next lever for the GPU thread); after a jump to a new area near, flow's cards mount a few a frame and the GPU shows labelled boxes meanwhile; translucent orthogonal (running) edges double at their elbows; draw's and flow's engine and React costs in a drag of thousands of items at 4×; Forgeron Sans, shaping beyond the f-ligatures, VoiceOver itself (the list is checked in jsdom, not with a screen reader), touch, a GPU other than the M4.

## Palier 1, closing (20/11/2026): drags that cost what they move, edges culled, edges and groups for assistive technology

Step C left the drags of thousands of items at 4× CPU with a long task most steps: draw's engine rules, the store's commit and React's render of the editor and the inspector; flow's geometry of every edge, every step. The closing makes a step cost what it moves and what is in view.

**Draw's engine.** The rules still run after each step, in the gesture's one undo step, but `before` is no longer a copy of the board: for a command that says which items it changes (a drag step, a move, an update, a resize, a removal) only those are saved, and whatever a rule writes is saved before it is written (`BeforeView`, `core/follow.ts`: any other id reads the item as it is, which is what it was; iterating builds the whole map once). The rules get `get(id)`, the engine's lookup: `frame`'s `carry` reads the changed items by id, `arrow`'s `follow` no longer builds a map of the board and skips an arrow moved by exactly as much as every item it is bound to (it lies on them as it did). Membership still settles when the gesture ends; behaviour and the undo step are unchanged (a new contract test drags a frame, two bound items and their arrow, checks what the rules see, the arrow kept, one undo, and an arrow dragged alone letting go). The TS engine no longer prunes the selection after updates (nothing can have left) and records a gesture's first values without allocating.

**What the canvas draws.** `far.moves`: an item's drawing moved by whole world units, with the same data, size and flags, is its drawing moved; the canvas gives its group an offset and does not ask the kind again, so a select-all drag calls no kind and packs nothing (the buffer sees the same primitives and only places the offset). `far.depends`: a box the drawing also depends on (draw's clipping frame, read from the store), compared at each change and moved with the item, so draw's kinds stay one function when a frame moves (they were rebuilt at every step of a drag that moved a frame, and every item drawn again). The DOM renderer draws only the selection outlines that meet the surface (flow at 100 % drew 2,000 SVG outlines a step). `<Minimap>` draws outside React: at once for the camera, at the next frame for items and the selection, its exact redraw (every 120 ms at most while changes come) in a task of its own; its fill is set only when it changes. The offscreen list's options are memoised.

**Draw's interface.** The properties panel is drawn again only when what it shows changes: not when items move, are resized or an arrow's ends follow; its panels and buttons read the items as they are when they act (a drag rendered its twenty tooltips every step).

**Flow.** The graph read after a drag reuses the last one's edges and groups and the nodes that did not move (`itemsToGraphAfter`); `indexGraph` is kept per graph and rebuilt from the last one when only nodes changed; an edge whose two nodes moved by the same whole units keeps its shapes, moved by its group's offset (`FarEdge.dx`, `dy`; `edgeAt` hit-tests where it is drawn), and an edge whose nodes did not change is the same object; the DOM edge layer computes paths only for the edges it shows (hovered, selected, dragged); a card is not rendered again when its node only moves; the minimap's colours are memoised by run. Near (cards), the edges in the GPU buffer are those in the canvas's cull window plus those hovered, selected or dragged; from far, all of them (the view holds most, and a zoom would otherwise lay the buffer out at every step).

**Assistive technology.** The canvas takes `listEntries` (`CanvasListEntry`: options that are not items, in reading order with them, at most 200, the nearest the view's centre chosen by selection, not a sort): flow lists its edges in the cull window, "Edge from A to B" with `nodeLabel`, described as `edge`, selected with the edge selection, the last selected one the surface's active descendant while no node is. Each group's label is a real button again (offscreen: over the drawing, a few dozen buttons were each a compositing layer, 32 → 47 layers at fit), "Select the group …"; Enter or Space selects the group's nodes, a press on the drawn label still does (the host finds it by its box). Tests: the edge in the list, its role, selection and active descendant; the button's name, Enter, Space and a press.

**Parity** against `f090550b` (1,440 × 900 at 2×, `pd-run/shots`, `b-` before, `a-` after): draw identical to the pixel at all 16 shots (100 %, 200 %, 40 %, 20 %, fit); flow identical at 11 of 12 (100 % and 200 % of the four areas, 40 % reconciliation, 20 %, fit); 40 % routing differs by 1,009 pixels of 5.18 M (328 by more than 2 levels, at most 8): edges overlapping in another order, the buffer having laid them out again as they entered the cull window.

**Numbers.** Same harness, scenarios and flags as step C (headless Chrome, `--use-angle=metal --enable-gpu-rasterization --ignore-gpu-blocklist`, 1,440 × 900 at 2×, 120 wheel steps); before is `f090550b`, after the working tree on it, built and measured back to back. The machine was not quiet: the load average stayed above 3 for the ten minutes waited (3.4 at the start, 5.4 to 6 during the runs, 3.8 at the end); an earlier run of the same builds (load 3 to 5) agrees on the drags and disagrees on pan and zoom at 4× by as much as the differences below. Final run, normal CPU:

| page, gesture             | main/step before → after | frame p50 / p95 before → after | GPU thread    | long tasks (max ms) |
| ------------------------- | -----------------------: | -----------------------------: | ------------- | ------------------- |
| board fit, pan            |                2.2 → 2.2 |        2.3 / 15.5 → 2.5 / 12.4 | 5 → 5.08      | 0 → 0               |
| board fit, zoom           |                3.0 → 2.6 |        4.4 / 12.6 → 3.9 / 10.7 | 6.5 → 6.42    | 0 → 0               |
| board 100 %, pan          |                2.5 → 1.7 |            4.4 / 9.8 → 2.3 / 7 | 5.62 → 5.79   | 0 → 0               |
| board 100 %, zoom         |                3.2 → 2.7 |        5.6 / 11.1 → 3.9 / 11.3 | 5.52 → 8.43   | 0 → 0               |
| board cross               |                2.6 → 3.1 |           4 / 9.8 → 5.1 / 10.6 | 6.13 → 7.32   | 1 (15) → 1 (12)     |
| 2,000 items fit, pan      |                2.5 → 1.5 |             3.7 / 12 → 2 / 6.4 | 4.69 → 3.4    | 0 → 0               |
| 2,000 items fit, zoom     |                2.5 → 2.4 |            4 / 7.9 → 4.2 / 7.4 | 5.02 → 4.33   | 0 → 0               |
| 2,000 items 100 %, pan    |                1.4 → 1.7 |          2.2 / 4.9 → 2.6 / 6.3 | 3.69 → 3.99   | 0 → 0               |
| 2,000 items 100 %, zoom   |                2.4 → 2.4 |          4.1 / 7.8 → 4.1 / 7.3 | 4.01 → 3.65   | 0 → 0               |
| 2,000 items cross         |                2.3 → 2.2 |          3.9 / 6.6 → 3.8 / 6.3 | 3.79 → 4.24   | 0 → 0               |
| order-to-cash fit, pan    |                1.4 → 1.6 |          2.1 / 5.5 → 2.1 / 6.1 | 4.55 → 6.73   | 0 → 0               |
| order-to-cash fit, zoom   |                2.5 → 3.7 |         3.9 / 7.6 → 5.6 / 12.1 | 4.31 → 5.23   | 0 → 1 (25)          |
| order-to-cash 100 %, pan  |                1.2 → 2.0 |            2 / 3.1 → 3.7 / 5.6 | 3.6 → 4.2     | 0 → 0               |
| order-to-cash 100 %, zoom |                2.5 → 3.0 |         3.8 / 7.6 → 4.8 / 10.2 | 3.56 → 3.93   | 0 → 0               |
| order-to-cash cross       |                2.8 → 3.0 |              4 / 8.2 → 5 / 8.1 | 6.48 → 4.91   | 0 → 0               |
| 2,000 nodes fit, pan      |                2.3 → 2.4 |             3 / 9.3 → 3 / 12.1 | 10.77 → 11.46 | 0 → 1 (12)          |
| 2,000 nodes fit, zoom     |                3.8 → 3.7 |            6 / 12.5 → 5 / 14.8 | 3.81 → 9.56   | 1 (19) → 2 (27)     |
| 2,000 nodes 100 %, pan    |                2.5 → 2.8 |          4.2 / 7.4 → 4.6 / 9.6 | 10.92 → 6.04  | 0 → 0               |
| 2,000 nodes 100 %, zoom   |                3.5 → 4.0 |          5 / 10.8 → 5.4 / 13.5 | 10.13 → 5.33  | 0 → 0               |
| 2,000 nodes cross         |                4.0 → 4.0 |          4.7 / 13.3 → 5 / 12.5 | 10.31 → 8.81  | 0 → 0               |

At 4× CPU throttling (load 5.4 to 5.8):

| page, gesture             | main/step before → after | frame p50 / p95 before → after | GPU thread  | long tasks (max ms) |
| ------------------------- | -----------------------: | -----------------------------: | ----------- | ------------------- |
| board fit, pan            |                8.1 → 5.6 |        8.9 / 36.3 → 6.5 / 28.1 | 4.9 → 4.17  | 19 (51) → 11 (33)   |
| board fit, zoom           |               9.0 → 10.2 |      14.5 / 38.4 → 15.6 / 44.5 | 5.77 → 6.18 | 20 (34) → 24 (41)   |
| board 100 %, pan          |                4.0 → 5.2 |        6.6 / 15.6 → 8.1 / 18.5 | 4.07 → 5.11 | 0 → 2 (14)          |
| board 100 %, zoom         |                8.2 → 9.2 |        13.4 / 29.7 → 16.4 / 32 | 6.04 → 4.75 | 16 (21) → 19 (22)   |
| board cross               |                8.0 → 8.0 |      13.2 / 29.5 → 13.3 / 28.1 | 3.96 → 5.44 | 12 (35) → 10 (33)   |
| 2,000 items fit, pan      |                4.6 → 5.2 |          6 / 25.1 → 7.2 / 26.3 | 2.82 → 3.16 | 6 (18) → 12 (18)    |
| 2,000 items fit, zoom     |                6.7 → 7.9 |      11.7 / 20.6 → 12.7 / 23.4 | 3.52 → 3.9  | 2 (21) → 5 (24)     |
| 2,000 items 100 %, pan    |                3.5 → 3.9 |          6 / 14.1 → 6.4 / 14.2 | 2.76 → 3.81 | 0 → 0               |
| 2,000 items 100 %, zoom   |                5.8 → 7.4 |      10.6 / 20.4 → 13.5 / 23.2 | 2.63 → 3.18 | 1 (14) → 4 (15)     |
| 2,000 items cross         |                6.3 → 6.5 |        11.2 / 18.3 → 11.4 / 21 | 3.42 → 3.38 | 0 → 2 (14)          |
| order-to-cash fit, pan    |                3.9 → 4.9 |        5.9 / 16.6 → 7.2 / 23.1 | 3.7 → 3.23  | 1 (12) → 4 (19)     |
| order-to-cash fit, zoom   |                8.8 → 9.9 |          14 / 29.9 → 16 / 33.8 | 4.34 → 4.58 | 14 (35) → 21 (37)   |
| order-to-cash 100 %, pan  |                3.0 → 5.9 |         5.3 / 9.4 → 9.2 / 13.7 | 2.82 → 3.7  | 0 → 2 (108)         |
| order-to-cash 100 %, zoom |                7.9 → 9.0 |      12.3 / 31.4 → 14.7 / 35.9 | 3.46 → 3.76 | 17 (22) → 15 (26)   |
| order-to-cash cross       |               10.7 → 9.5 |        17 / 38.8 → 15.8 / 29.4 | 3.91 → 4.08 | 37 (23) → 8 (20)    |
| 2,000 nodes fit, pan      |                5.3 → 5.6 |        7.9 / 22.7 → 7.7 / 36.9 | 9.28 → 6.75 | 3 (16) → 10 (25)    |
| 2,000 nodes fit, zoom     |              10.9 → 10.4 |      17.2 / 42.5 → 16.3 / 48.4 | 9.48 → 7.17 | 26 (56) → 31 (68)   |
| 2,000 nodes 100 %, pan    |                8.2 → 8.3 |      14.2 / 26.4 → 14.2 / 31.4 | 3.63 → 5.02 | 13 (16) → 16 (19)   |
| 2,000 nodes 100 %, zoom   |              11.6 → 11.6 |        17.2 / 56.7 → 19 / 49.8 | 7.93 → 5.73 | 31 (31) → 37 (39)   |
| 2,000 nodes cross         |              12.9 → 12.9 |        20 / 50.8 → 17.8 / 50.4 | 9.3 → 9.53  | 33 (25) → 35 (39)   |

Pan and zoom at 4× are within the noise of the two runs for draw (2,000 items at 100 %, zoom: 15 → 1 long tasks in the first, 1 → 4 in the second). Flow at 4× has a few more long tasks in pan and zoom near (2,000 nodes at 100 %: 4 → 13 and 13 → 16 in pan), from edges entering and leaving the buffer as the window moves (each lays the buffer out by copies), for a GPU thread down from 8 to 9 ms a step to 5 to 7.

Gestures (main-thread tasks over 12 ms over 60 steps; two runs, before → after):

| gesture                                        | normal CPU     | 4× CPU                                                                  |
| ---------------------------------------------- | -------------- | ----------------------------------------------------------------------- |
| draw, select all and drag, board 100 %         | 1 → 0; 0 → 0   | 54 → 3 (max 32); 41 → 28 (max 46)                                       |
| draw, select all and drag, 2,000 items 100 %   | 0 → 0; 0 → 0   | 17 → 3 (max 24); 8 → 5 (max 29)                                         |
| draw, select all and drag, board fit           | 1 → 1; 3 → 1   | 60 → 64 (26–43 → 14–20 ms a step); 60 → 61 (25–40 → 16–23)              |
| draw, typing 40 characters                     | 0 → 0; 0 → 0   | 17 → 3; 11 → 1                                                          |
| flow, select all and drag, order-to-cash 100 % | 0 → 0; 0 → 0   | 39 → 16; 58 → 20 (rAF p95 33 → 16.8)                                    |
| flow, drag a group (16 nodes), 100 %           | 0 → 0; 0 → 0   | 22 → 7; 35 → 1                                                          |
| flow, select all and drag, 2,000 nodes fit     | 1 → 1; 1 → 1   | 1 → 1; 1 → 1 (the first step)                                           |
| flow, select all and drag, 2,000 nodes 100 %   | 18 → 0; 21 → 0 | 60 → 20 (33–117 → 14–28 ms); 60 → 18; rAF p50 33 → 16.7, p95 100 → 16.8 |

Where it stands. Normal CPU: no long task in any drag, typing or group drag, and flow's 2,000 nodes at 100 % went from 18–21 to none. At 4×, the target of palier 1, no long task in a select-all drag of 2,000 items, is met only in part: 2,000 items have 3 to 5 (the first steps, as the gesture starts), the 2,618-item board 3 to 28 depending on the load, flow's 2,000 nodes 18 to 20 of 60 at 14–28 ms with every frame on time (rAF p50 16.7 ms), and a drag of the board at fit stays a long task a step (16–23 ms, from 26–43). A profile of a step at 4× (2,618 items) shows what is left: the canvas engine's own commit for every item moved (patches, the id table and the spatial index's cells, about 4 ms), the draw rules over the moved set (about 1.5 ms), React's render of the canvas (cull window, far groups, chrome, about 2 ms) and the far buffer placing 2,618 offsets; for flow, its loop over 2,800 edges (about 2 ms), the graph and index read again (about 1 ms) and React's reconciliation of the cards in view. The next levers are structural: the engine's spatial index updated once per gesture step for a moved set (a translation of a set of slots), a drag that moves the selection by one offset on the GPU instead of one per item, and flow's edges kept outside React.

Not done in the closing: a visible focus for the offscreen group buttons (Enter selects and shows the selection; the label is not highlighted while its button has the focus); edge labels; a screen reader run (the lists are checked in jsdom); the pan and zoom regressions of flow near at 4× (edges entering the culled buffer); touch; a GPU other than the M4.

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
