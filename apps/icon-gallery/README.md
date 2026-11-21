# @forgeron/icon-gallery

The development gallery of [`@forgeron/icons`](../../packages/icons/README.md). Not deployed.

```sh
bun run --cwd apps/icon-gallery dev   # http://localhost:5179
```

- `/`: every icon of the catalog. Search by name, label or alias (`/` focuses the search), filter by category, switch monotone and duotone. An icon opens its detail: size, colours, secondary tone, stroke, backdrop, the pixel grid; copy the SVG, the React snippet, the import or the name; download SVG, PNG, JPG or WEBP. The query lives in the address bar (`/?category=arrows&icon=arrow-down-01`).

## Design

The look is the lab design language of the site (`apps/site/src/lab`). An app cannot import another app, so `src/styles/lab.css` is a trimmed copy of its tokens and components, and `public/fonts` a copy of Forge Sans. Both should move to a shared package once the lab design is settled.
