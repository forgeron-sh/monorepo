# @forgeron/blueprint-site

The site of the Blueprint format, served on `blueprint.forgeron.sh` (phase P6 of [`docs/blueprint/engine.md`](../../docs/blueprint/engine.md)). The moon project id is `blueprint-site`, because `packages/blueprint` already takes `blueprint`.

```sh
bun run --cwd apps/blueprint dev     # http://localhost:5182
bun run --cwd apps/blueprint build   # static output in dist/
bun apps/blueprint/scripts/check-links.ts   # after a build: links, anchors, the schema
```

## Pages

- `/`: what the format is, in a few lines. A library scene (`host-servers.bp`) plays live through `playCompiled`. Below it, a whole example file and its picture, drawn at build time.
- `/format`: the normative text, rendered from `docs/blueprint/format.md` as it is (Astro's own Markdown, no copy), with a table of contents. Its relative links to `engine.md` go to the document on GitHub (`src/lib/doc-links.ts`).
- `/library`: every part and assembly of `@forgeron/libraries/blueprints`, each framed alone and drawn as a static SVG at build time by the engine (`src/lib/parts.ts`). The SVGs use `var(--token, fallback)` colours. A part whose defaults draw nothing is first drawn with its flags on. If that still draws nothing (the village's parts take their sizes from `calc` tracks), it is drawn as it stands in its file's scene, at the progress and time where it draws the most. Search, a kind filter and a file filter all live in the address bar. Each card opens its file in the viewer.
- `/viewer`: the P5 viewer (`@forgeron/blueprint-canvas`) on the library. `?file=name.bp` opens that file. A dropped or picked file is read in the page and never uploaded.
- `/schema/v1.json`: the JSON Schema that every `.bp` names in `$schema`, written from `SCHEMA` of `@forgeron/blueprint/format`. A test checks that it equals `packages/blueprint/schema/blueprint.v1.json`. `public/_headers` serves it with CORS and `application/schema+json`.

## Checks

- `src/lib/parts.test.ts`: every library part and assembly draws a non-empty SVG. The only exception is `stack6.bp/static`, which has no prims: the site's script layer draws it. The library page also fails the build if a part with prims draws nothing (`assertDrawn`).
- `src/lib/example.test.ts`: the home page's example file is valid and draws.
- `src/lib/schema.test.ts`, `src/lib/doc-links.test.ts`.
- `scripts/check-links.ts` (moon task `links`): every internal `href` and `src` of the built pages resolves to a file, every anchor resolves to an id, and the schema's `$id` is right.

## Release

The site is wired like the other sites (`font`, `ui-gallery`): a Workers static-assets Worker, `forgeron-blueprint`, whose `wrangler.jsonc` carries the custom domain `blueprint.forgeron.sh` and serves `dist/`. Nothing in this folder deploys.

## Design

The lab design language. `src/styles/lab.css` is a copy of the UI gallery's (an app never imports another app), and `public/fonts` is a copy of Forgeron Sans. The viewer's chrome comes from `@forgeron/ui`.
