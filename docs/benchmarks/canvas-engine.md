# Canvas engine: TypeScript or Rust/WebAssembly? (D-148 benchmark)

**Date**: 18/11/2026 · **Question**: should the core of `@forgeron/canvas` move to Rust compiled to WebAssembly? D-148 set the bar: 20,000 items panned and zoomed at 60 frames per second, a hit test under 1 ms, and the size of the `.wasm`.

**Short answer**: not now. The spatial index is what the engine is missing, not the language. With the same index, TypeScript already meets every D-148 target with a wide margin (20,000 items: a culled frame in a few hundredths of a millisecond, a hit test around a microsecond). Rust is 2 to 7 times faster again on the same algorithm, and its module is tiny (37 KB, 16 KB gzipped), but it buys time where there is already plenty, and costs a second toolchain. Keep the crate as a measured option and the `CanvasEngine` interface as the door; move to Rust when a workload that TypeScript cannot carry shows up (see "When to revisit").

## What was measured

Three engines, fed the same `Item` objects and answering in the same currency (string ids, a `Float32Array` of instances):

| engine      | what it is                                                                                                                                                                                                                        |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ts-scan`   | `createTsEngine` as it is today (`packages/canvas/src/core/ts-engine.ts`): every query scans the items                                                                                                                            |
| `ts-index`  | the Rust crate's algorithm ported line for line to TypeScript (`packages/canvas/bench/ts-grid.ts`), so that the comparison is not "Rust beats a linear scan"                                                                      |
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

1. **The scans of the current engine, not its language.** `ts-scan` sorts every item on every hit test (`topDown` copies and sorts the document: 0.5 ms at 20k, 3 ms at 100k, a miss of the 1 ms target), culls by testing every item (1.4 ms a frame at 100k zoomed in), and moves through `applyPatches`, which maps the whole document once per patch (500 patches × 20,000 items: 67 ms; 450 ms at 100k: a drag of a large selection would stutter). All three are fixed in TypeScript by the index and by applying patches through a map: `ts-index` moves 500 items in 0.07 ms.
2. **With the same index, the language is a factor of 2 to 7**, on times that are already small. At 20,000 items zoomed in, a frame costs 0.02 ms in TypeScript and 0.003–0.007 ms in Rust: both are under 0.2 % of a 16.7 ms frame. The gap matters only where every item is touched each frame: an overview of 100,000 items costs 1.9 ms in TypeScript and 0.5–0.8 ms in Rust.
3. **Drawing, not culling, sets the frame time** once the index is in. Uploading 100,000 instances is 2.4 MB a frame; drawing them is the GPU's work, the same whichever engine built the buffer. In headless Chrome SwiftShader takes tens of milliseconds to rasterise a frame on a loaded CPU; on a real GPU an instanced draw of 100,000 quads is expected to be well under a frame (not measured here).
4. **Data layout mattered as much as the language.** Moving from a struct of arrays to one record per item, and gathering through a rank bitmap instead of sorting, made large box selections several times faster in both languages (natively, a box of 25,000 items out of 100,000 went from 4–8 ms to about 1 ms); a weak hash (the bare FxHash multiply, whose low bits depend on `cy` only) had piled whole columns of cells into one probe chain. These were found and fixed in both engines.
5. **Load is the one place the indexed engines are slower**: building the index and the id table costs 5–7 ms at 20k and 24–49 ms at 100k, against a sort for `ts-scan`. Acceptable for opening a document; a bulk build (sort items by cell, then fill) would cut it if it ever matters.

## Recommendation: TypeScript with the index now, Rust kept as an option

**Put the spatial index in the TypeScript engine now** (promote `bench/ts-grid.ts` into `src/core/`, behind `createTsEngine`'s queries `hit`, `in-rect`, `visible`; drop the per-hit sort; apply patches through the id map). That alone takes the engine from failing D-148's hit-test target at 20k (0.5 ms p50, 1.6 ms p99) and stuttering on large moves, to meeting every target with two orders of magnitude to spare, with no new toolchain. **Do not move the core to Rust yet**: on the same algorithm it is 2–7 times faster, but on paths that already cost well under a millisecond at 20,000 items, while it brings a second language, a build step (rustup, the wasm target, wasm-bindgen pinned to the crate, wasm-opt) in CI and in every contributor's setup, and a JavaScript/WebAssembly boundary that every new feature has to be designed around. **Keep `crates/fg-canvas-core` and this benchmark** as the measured path, and revisit when the blueprint scene engine (isometric, animated) arrives: many animated items whose geometry is recomputed every frame (sprites sorted by depth, paths, particles) is the workload where per-item CPU work scales with the visible count every frame, and where the 3–5× of the O3 build and the absence of garbage collection would pay. Flow and draw need not wait: they sit on `CanvasEngine`, which this work does not change.

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
