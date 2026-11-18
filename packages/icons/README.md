# @forgeron/icons

Forgeron's icons: one named export per icon, plain data that a bundler drops when it is not imported, in two variants (monotone and duotone). The catalog mirrors the list of names of [Hugeicons](https://hugeicons.com), plus our own; every drawing is ours. A name with no drawing yet is a **stub**: it is exported, it renders nothing, and the manifest says it is not implemented.

The gallery lives in `apps/icon-gallery` (`bun run --cwd apps/icon-gallery dev`, port 5179).

## Use

```tsx
import { AnvilIcon, toSvg } from "@forgeron/icons";
import { Icon } from "@forgeron/icons/react";

<Icon icon={AnvilIcon} />                                   // 24 px, currentColor, monotone
<Icon icon={AnvilIcon} variant="duo" size={48} title="Forge" />
<Icon icon={AnvilIcon} variant="duo" secondaryColor="var(--accent)" secondaryOpacity={1} />

toSvg(AnvilIcon, { size: 96, color: "#ededed" });           // SVG markup, or null for a stub
```

| Prop / option      | Default                                                              | Notes                                                    |
| ------------------ | -------------------------------------------------------------------- | -------------------------------------------------------- |
| `variant`          | `"mono"`                                                             | `"duo"` draws the secondary shapes in the secondary tone |
| `size`             | `24`                                                                 | px; a multiple of 12 keeps pixel icons crisp             |
| `color`            | `currentColor`                                                       | primary tone                                             |
| `secondaryColor`   | `var(--icon-secondary, currentColor)`                                | duotone only                                             |
| `secondaryOpacity` | `1` with `secondaryColor`, else `var(--icon-secondary-opacity, 0.4)` | duotone only                                             |
| `title`            | none                                                                 | gives `role="img"` and a name; without it, `aria-hidden` |

Other props of `<Icon>` go to the `<svg>`. A stub renders `null`; `icon.implemented` tells a drawn icon from a stub at runtime.

Entry points: `.` (icons, `toSvg`, types), `./react` (`Icon`), `./catalog` (every icon by name, `getIcon`, `getEntry`, the manifest and the categories; imports the whole catalog, for galleries and scripts only).

## Data shape

- **Pixel icon** (`style: "pixel"`): rows of a square grid, `#` primary tone, `o` secondary tone. Rendered as runs of rectangles with `shape-rendering="crispEdges"`. Every drawn icon is a pixel icon on the 12×12 grid of the site's lab icons, 16×16 for a brand mark that does not fit (a test enforces it; the grid decision is in `docs/icons.md`); the console's stroke glyphs were redrawn as pixel icons, and no vector style is shipped. `style` stays in the data as a discriminant for a second style, should one ever be added.
- **Stored trimmed**: a row drops its trailing `.` and the icon drops its trailing empty rows; `pixelRows` pads them back, so the output is unchanged. Leading empty rows stay as `""`. `bun run trim` rewrites the drawings, `bun run trim:check` and a test in `render.test.ts` fail on an untrimmed one. Measured on 2026-11-17 over 322 icons: 240 → 184 bytes of data per icon (−23 %), 7.4 → 6.6 KB gzipped for the set (−11 %); an icon's data is about half the size of its SVG (114 B against 227–259 B gzipped), and the renderer costs about 1 KB gzipped once.
- **Stub**: `{ name, implemented: false }`.
- **Drawn as another icon**: a name that means the same thing as a drawn icon (`trash` and `delete-01`, `bell` and `notification-01`) reuses its drawing instead of a near-identical second one. `src/generator/same-as.ts` lists them (669 names on 2026-11-17, mapped by meaning, then checked on a contact sheet); the generator copies the rows into the export of the name, which keeps its own `name`, and the manifest gives the source drawing in `sameAs`. Drawing the name for real means removing its line; the generator fails while both exist.

Monotone folds the secondary shapes into the primary tone; duotone gives them the secondary tone. The manifest says which icons have a duotone that differs (`variants.duo`).

## Add or draw an icon

**Read [`docs/icons.md`](../../docs/icons.md) first**: the drawing protocol, the review checklist and the rules. An icon is accepted when it reads at 16, 24 and 48 px in its detail in the gallery (`/?icon=<name>`), not from its rows.

1. Check first that no drawn icon already shows the same thing; if one does, add the name to `src/generator/same-as.ts` instead of drawing it. Otherwise write `src/drawn/<name>.ts`, with a default export whose `name` is the file name. A Hugeicons name replaces its stub; a name of our own must also be added to `OWN_ICONS` in `src/generator/curated.ts`.
2. Optionally give it a category, labels, a description or aliases in `CURATED` (`src/generator/curated.ts`).
3. `bun run generate` (in this package).

The generator only writes `src/generated/`, so it never touches a drawing, and it writes the same files when run twice. `bun run generate:check` fails when `src/generated/` is out of date; `manifest.test.ts` fails too.

## Where the names come from

- **Source**: the Iconify listing of the Hugeicons set, `https://api.iconify.design/collection?prefix=hugeicons`, snapshotted in `data/hugeicons-names.json` with its fetch date (`fetchedAt`). The generator works offline from it; `bun run generate:refresh` fetches it again.
- **Snapshot of 2026-11-16**: 6,114 visible names, 26 hidden, 26 aliases. Iconify gives no categories, tags or descriptions.
- **Hidden names** (renamed or withdrawn, such as `four-k`) are left out of the catalog.
- **Aliases** become `aliases` of the entry they lead to, after following chains (`first-brecket` → `first-bracket` → `1st-bracket`); an alias that leads to no visible name is dropped. Aliases get no export.
- **Export names**: PascalCase and `Icon`. A leading number is spelled out (`1st-bracket` → `FirstBracketIcon`, `3d-move` → `ThreeDMoveIcon`), as are single digits next to each other (`sorting-1-9` → `SortingOneNineIcon`). Hugeicons lists twelve names twice, with and without a hyphen before a number (`rows-2`, `rows2`): the hyphenated one keeps the plain export, the other marks the glued number with `_` (`Rows_2Icon`).

## Taxonomy

Categories, labels and descriptions are **our own**, derived from the names by the rules of `src/generator/taxonomy.ts`. Hugeicons publishes no category list that we could verify, so none of this comes from Hugeicons. A category is chosen by: known pairs of words first (`cloud` + `rain` is the weather, `cloud` alone the network), then the first word that is not a qualifier (`square`, `add`, `circle`…), then any word, else `general`. About 10% of the names land in `general`. Labels are the words of the name, a few synonyms and the category; the description is the name in words. `CURATED` overrides all of it for drawn icons.

## Licence and attribution

- This package: Apache-2.0, like the repository.
- **No Hugeicons artwork is vendored.** We use the list of names only; every drawing is ours: the site's lab icons, pixel versions of the console's glyphs, or drawn for this package.
- For the record, `@hugeicons/core-free-icons` 4.4.0 (npm, read on 2026-11-16) is under the MIT licence (`LICENSE.md`: "Copyright (c) 2025 Hugeicons"), which would allow vendoring its free Stroke Rounded icons with the notice kept. We chose not to: our icons are a pixel style, and mixing sets would break it. Pro icons (`@hugeicons-pro/*`) are under a separate licence and must never be used.
- **Third-party brand icons** are pixel renditions of the real marks, drawn to refer to the brand, and carry a `trademark` note in the manifest. Today: `cloudflare` (16×16 grid, rasterised from Iconify's `logos:cloudflare-icon`, then redrawn by hand on 2026-11-16; Cloudflare's trademark page asks for written permission to use its logo, see `docs/icons.md`); "Cloudflare and the Cloudflare logo are trademarks of Cloudflare, Inc., used here only to refer to Cloudflare." `github` (16×16 grid, rasterised from Iconify's `simple-icons:github`, then redrawn by hand on 2026-11-17): "GitHub and the Octocat logo are trademarks of GitHub, Inc., used here only to refer to GitHub." `forgeron` is our own mark. `mcp` is the site's plug glyph, not a third-party logo.
- **References**: icons redrawn after a Hugeicons icon (the chevrons, `tick-01`, `git-fork`, `settings-01`) took its proportions and composition from the Iconify preview only; nothing was traced or copied. The manifest's `reference` field names the source of each.

## Layout

`src/generated/` holds 27 shards (one per first letter, `icons-0-9.ts` for digits) with named exports, `index.ts`, `names.ts` (the `IconName` type) and `manifest.json`. Measured on 2026-11-16 against one file per icon (6,121 files): `tsc --noEmit` on the package 0.93 s against 1.40 s, a bundle of the whole catalog 20 ms against 222 ms, and 30 module requests instead of 6,000 when the dev gallery loads. Lint, format and dependency-cruiser skip `generated/` folders already.
