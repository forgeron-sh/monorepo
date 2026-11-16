# @forgeron/icon-gallery

The development gallery of [`@forgeron/icons`](../../packages/icons/README.md). Not deployed.

```sh
bun run --cwd apps/icon-gallery dev   # http://localhost:5179
```

- `/`: every icon of the catalog. Search by name, label or alias (`/` focuses the search), filter by category, status (drawn or stub) and origin of the name, switch monotone and duotone. An icon opens its detail: size, colours, secondary tone, stroke, backdrop, the pixel grid; copy the SVG, the React snippet, the import or the name; download SVG, PNG, JPG or WEBP. The query lives in the address bar (`/?category=arrows&icon=arrow-down-01`).
- `/review`: every drawn icon at 16, 24 and 48 px, in both tones, on dark and light, and as a 1× screen draws it; `?only=a,b` keeps some icons, `?loupe=1` enlarges the device pixels. The review step of [`docs/icons.md`](../../docs/icons.md).
- `/grids`: the grid study of 2026-11-16, the same subjects on 12, 16 and 24-pixel grids (study drawings in `src/lib/grid-study.ts`, not exported).
- `/coverage`: one block per category, sized by its number of names, filled with one square per icon (fewer when the block cannot hold them all); ember squares are drawn icons. A block opens its category in the gallery.

## Design

The look is the lab design language of the site (`apps/site/src/lab`). An app cannot import another app, so `src/styles/lab.css` is a trimmed copy of its tokens and components, and `public/fonts` a copy of Forge Sans. Both should move to a shared package once the lab design is settled.
