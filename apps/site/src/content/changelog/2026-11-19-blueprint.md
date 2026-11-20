---
title: "Blueprint: the .bp format, played by a Rust engine"
summary: "The site's isometric scenes are now a file format, compiled at build time and played by a Rust core in a worker, with its own site at blueprint.forgeron.sh."
date: 2026-11-19
type: New
areas: [Blueprint]
---

### New

- Scenes are written as `.bp` files and compiled to SceneBin at build time.
- A Rust core renders them, identical to the TypeScript renderer on still frames, and plays timelines, state machines and rigs.
- `blueprint.forgeron.sh` documents the format, its schema and the part library, with a viewer.

### Improved

- The rasteriser runs in WebAssembly with SIMD, in a smaller module.
- The site plays its scenes in a worker, loaded when a scene comes near the screen.
