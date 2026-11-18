# @forgeron/ui-gallery

The gallery of [`@forgeron/ui`](../../packages/ui/README.md), on `ui.forgeron.sh`.

```sh
bun run --cwd apps/ui-gallery dev   # http://localhost:5181
```

- `/`: the identity, a row of shaders, every atom and block with a live demo, then the pages planned (Soon).
- `/identity/<page>`: logo, colours, typography and tokens, read from `assets/design-system/tokens.json` (the source of `tokens.css`). `public/brand` is a copy of the SVGs of `assets/logos`.
- `/shaders`, `/shaders/<shader>`: the pixel fields and effects Forgeron draws online (ordered dither, dither field, the four WebGL fields, dithered image, hearth, dither reveal, burn): what each is, where it runs, its versions live, the code to use it and its options. Data in `src/lib/shaders.ts`; the shaders come from `@forgeron/ui` (`packages/ui/src/shaders`), except the burn, a demo copy of the site's in `src/shaders/burn.ts`.
- `/docs/<atom>`: the atom's examples (preview or code, copy), its import line and its props. `/docs/installation`: add the package and its styles.
- `/blocks`: the pickers of a record's properties (status, priority, size, due date, quarter, person, labels), then the blocks after Tasks (issue list and board, projects table, filter bar, display menu, view header, property panel, activity, create dialog, app sidebar, command palette, action menu, inbox), then the ones planned. Block pages share `/docs/<slug>` with the atoms. `/pages`: whole screens after the HTML prototypes (`docs/prototypes`).

## Add an atom or an example

1. The component lives in `packages/ui` (its CSS in `atoms.css`, a test next to it).
2. Its entry in `src/registry.ts` (a block: in `src/entries/<group>.ts`): slug, name, one line, imports, props.
3. Its examples in `src/examples/<slug>/<nn>-<name>.tsx`, a default export each. The number orders them, the name is the title, the file is the code shown. The first one is the demo of the index: keep it short.

## Design

The lab design language, as on the font and icon sites: `src/styles/lab.css` and `public/fonts` are copies (an app never imports another app). The components bring their own styles from `@forgeron/ui/styles.css`. Code is highlighted at build time with Shiki in a grey theme with ember keywords.
