# @forgeron/site

The `forgeron.sh` marketing site: Astro, static pages, deployed as a Workers static-assets Worker (`wrangler.jsonc`).

## Layout

- `src/pages/index.astro`: the home page, in the lab language (voice and brand: `docs/design-system.md`). It is composed of `@forgeron/ui` atoms (`Button`, `Tag`, `Chip`, `Led`, `Command`, `Icon`, `Title`, `PixelText`, `Logo`…) and of the site's own composition: navigation, hero, sections, footer.
- `src/pages/design-system/architecture.astro`: the architecture diagram of a tool, on the manifests of the four templates (a React island).
- `src/layouts/Site.astro`: the document: `@forgeron/ui/tokens.css`, `@forgeron/ui/atoms.css`, `src/styles/site.css` (base, rail, the blocks of the home page), the fonts.
- `src/components/`: `SectionHead`, `Footer`, and the architecture preview.
- `src/illustrations/`: the canvases. `canvas.ts` mounts every `canvas[data-iso]` (a scene of `scenes.ts`) and `canvas[data-shader]` (a WebGL field) through `@forgeron/blueprint`; page scripts drive a scene through `isoCanvas(el)`. Without JavaScript the canvases stay blank and the rest of the page renders.
- `src/explorations/`: the design explorations the home page came from (`index`, `landing-a` to `landing-e`) and their support files (`lab/`). They are kept in the repository and type-checked, but not routed, so not published. To look at one, copy it under `src/pages/` locally; it still needs `public/fonts/` (its own `lab.css` loads Forge Sans from there).

## Commands

- `bun run dev` (port 5173), `bun run build`, `astro-check` through `moon run site:typecheck`.
