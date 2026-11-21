# @forgeron/ui-gallery

The gallery of [`@forgeron/ui`](../../packages/ui/README.md), on `ui.forgeron.sh`.

```sh
bun run --cwd apps/ui-gallery dev   # http://localhost:5181
```

- `/`: the identity, every atom, chart and block with a live demo.
- `/identity/<page>`: logo, colours, typography and tokens, read from `assets/design-system/tokens.json` (the source of `tokens.css`). `public/brand` is a copy of the SVGs of `assets/logos`.
- `/docs/<atom>`: the atom's examples (preview or code, copy), its import line and its props. `/docs/installation`: add the package and its styles.
- `/charts`: every chart and the chart parts (container, tooltip, legend), D-157; their pages share `/docs/<slug>`.
- `/blocks`: the pickers of a record's properties (status, priority, size, due date, quarter, person, labels), then the blocks after Tasks (issue list and board, projects table, filter bar, display menu, view header, property panel, activity, create dialog, app sidebar, command palette, action menu, inbox). Block pages share `/docs/<slug>` with the atoms.

- `/r/registry.json`, `/r/<slug>.json`: the shadcn registry (D-156), one item per atom, block and hook, plus `forgeron` (the `cn` helper and the stylesheet every item depends on) and `forgeron-theme` (our palette in the shadcn variables). Built at build time from the package sources by `src/lib/shadcn/build.ts` (pure) and `registry.ts` (the sources, through `import.meta.glob`). Item URLs follow `site`: `astro build --site http://localhost:4799` gives a registry to try locally with `npx shadcn add http://localhost:4799/r/button.json`. Each `/docs/<slug>` page shows its `shadcn add` line and the import once installed.

## Add an atom or an example

1. The component lives in `packages/ui` (its CSS in `atoms.css`, a test next to it).
2. Its entry in `src/registry.ts` (a block: in `src/entries/<group>.ts`): slug, name, one line, imports, props. The slug is also its shadcn item name.
3. Its examples in `src/examples/<slug>/<nn>-<name>.tsx`, a default export each. The number orders them, the name is the title, the file is the code shown. The first one is the demo of the index: keep it short.

## Design

The lab design language, as on the font and icon sites: `src/styles/lab.css` and `public/fonts` are copies (an app never imports another app). The components bring their own styles from `@forgeron/ui/styles.css`. Code is highlighted at build time with Shiki in a grey theme with ember keywords.
