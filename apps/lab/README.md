# @forgeron/lab-site

The lab of Forgeron, on `lab.forgeron.sh`: one place for every lab project and every paper.

```sh
bun run --cwd apps/lab dev     # http://localhost:5184
bun run --cwd apps/lab build   # static output in dist/
```

## Pages

- `/`: the hero (the dither field, the pixel reveal of the title, the bench: a Blueprint scene played by the engine), the legend of the states, then `/0.1` Stable, `/0.2` Experimental and `/0.3` Papers, three to a row, each with a square Blueprint cover.
- `/projects/<slug>`: a project's facts (state, area, package, last change), its points, its last commits and its papers.
- `/papers/<slug>`: a paper, with its projects, contents and how to cite it.

## Add a project or a paper

- **A project**: an entry in `src/data/projects.ts`. Its `id` (`L-10`) is permanent, never reused. `status` is `stable` (versioned, used in production) or `experimental` (its API may change any week); a project that graduates keeps its id and card. Its specimen is a case of `src/components/ProjectArt.astro`. Set `site` only when the site answers; `siteSoon` shows the domain with a Soon tag.
- **A paper**: the text stays in `docs/` (one source). Add its card to `src/data/papers.ts`: a permanent `id` (`R-006`), the file under `docs/` without `.md`, a kind (Benchmark, Design, Spec, Method), its first date and its projects, and its cover scene in `src/lib/scenes.ts` (`COVERS`, by number). Its first `#` title is hidden (the header shows the card's), and its relative links are rewritten at build: to another paper's page, or to the file on GitHub (`src/lib/links.ts`).

The scenes are rendered to a static SVG at build (`src/lib/render.ts` starts the engine with the package's `.wasm`), then the hero's is played on a canvas. The dates and a project's last changes come from `git log` at build (`src/lib/git.ts`); built outside a clone, they are left out.
