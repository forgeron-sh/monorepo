# Drawing a pixel icon

How to draw an icon for [`@forgeron/icons`](../packages/icons/README.md) that is good, and how to tell. Written on November 16, 2026, for people and for agents. The package README says how an icon is stored and registered; this guide says how to draw it.

**The criterion.** An icon is good when it **reads instantly and looks right at 16, 24 and 48 px**, on dark and on light. The rules below usually get there, but the rendered result is the judge: if a rule and the render disagree, the render wins.

## Quick protocol

10 minutes per icon, in this order. Do not skip step 6: every bad icon in the set so far was accepted from its rows, never looked at.

1. **Reference.** Look at two or three reference drawings of the subject (see [Sources of inspiration](#sources-of-inspiration)). Note their composition only: which parts, how many, how big against each other.
2. **Silhouette.** Decide the one shape that must survive at 16 px, and what can go. Write it in one sentence ("a ring with eight short teeth and a big hole"). If you need more than one sentence, the icon has too much in it.
3. **Grid.** 12×12. 16×16 only for a brand mark that cannot fit (see [Grid and sizes](#grid-and-sizes)). Plan the margins: keep a one-pixel margin unless the shape is round or must be large (a circle can touch the edges; a square should not).
4. **Line weight.** One pixel, like the rest of the set, or solid shapes. Choose one per icon and never mix a one-pixel outline with a two-pixel one.
5. **Rows.** Write the rows: `#` primary tone, `o` secondary tone, `.` empty. Use the secondary tone for one idea only, or not at all (see [Do and don't](#do-and-dont)). Draw with full rows if it helps, then run `bun run trim` in `packages/icons`: it drops trailing `.` and trailing empty rows, which the renderer pads back (a test fails until it is done).
6. **Render.** Put the drawing in `packages/icons/src/drawn/<name>.ts`, run `bun run generate` in `packages/icons`, start the gallery (`icon-gallery` in `.claude/launch.json`, port 5179) and open the icon's detail (`/?icon=<name>`). It shows the icon at 16, 24 and 48 px, in both tones, with its pixel grid.
7. **Review at 16, 24, 48** with the [checklist](#review-checklist). Compare with two or three neighbors of the set at the same size: same weight, same size on the grid.
8. **Fix and render again.** Change pixels, not the rule. Expect three or four rounds. Say so when it still does not read: no icon is better than a bad one in the set.
9. **Register.**
   - `src/drawn/<name>.ts`: the file name is the icon name; a comment says what it shows, and the reference it was redrawn after.
   - `src/generator/curated.ts`: the description, labels, `reference` for a brand mark (for example "simple-icons:x (Iconify, YYYY-MM-DD): rasterised, then redrawn by hand."), and `trademark` for a third-party logo.
   - A grid other than 12: add it to `WIDER_GRID` in `src/render.test.ts`, with the reason.
   - `bun run generate`, then `bunx vitest run packages/icons apps/icon-gallery`.
10. **Record** what you changed and why in the comment of the drawn file, so the next person knows the drawing was reviewed.

## Review checklist

Look at the rendered icon, not at the rows.

- [ ] At **16 px**, a stranger names the subject in a second. The silhouette alone is enough.
- [ ] At **24 px**, nothing looks broken, stray or blurred; the icon has the weight of `clock-01` or `lock` next to it.
- [ ] At **48 px**, the drawing looks deliberate: steady stair steps, no lumps, no accidental corners.
- [ ] **Light backdrop**: it still reads (thin gaps close up faster in dark ink on light).
- [ ] **Monotone**: it still reads with the secondary tone folded in. The duotone adds an idea, never the legibility.
- [ ] **No long unbroken run** that is not the subject itself (a table's border is the subject; a five-pixel slot through a cloud is not).
- [ ] **No orphan pixel**, no one-pixel noise, no checkerboard (see the note on the lab's dither motif below).
- [ ] **Gaps of two pixels** between separate parts where the grid allows, never fewer than one.
- [ ] **One line weight**, consistent with the set.
- [ ] **Optically centered** in the grid, and about the size of its neighbors.
- [ ] The drawing is **ours**: nothing traced, the reference recorded.

## Grid and sizes

**Decision (November 16, 2026): the base grid stays 12×12.** A 16×16 grid is allowed for a brand mark whose aspect ratio or detail does not fit 12 (`cloudflare` and `github` first; 28 brand marks in `WIDER_GRID` on November 20, 2026). No 24×24 grid.

**How it was decided.** The same subjects (a cog, a brand cloud, an arrow, a document, a user) were drawn on 12, 16 and 24-pixel grids and compared at 16, 24 and 48 px, in a study page of the gallery, since removed. What was seen and measured:

| Device pixels per grid pixel | 16 px       | 24 px       | 48 px     |
| ---------------------------- | ----------- | ----------- | --------- |
| 12 grid, 1× / 2× screen      | 1.33 / 2.67 | **2 / 4**   | **4 / 8** |
| 16 grid, 1× / 2× screen      | **1 / 2**   | 1.5 / **3** | **3 / 6** |
| 24 grid, 1× / 2× screen      | 0.67 / 1.33 | **1 / 2**   | **2 / 4** |

- **No grid is crisp at all three sizes on a 1× screen.** A fractional ratio blurs: drawn to a canvas, a 12-grid icon at 16 px came out with 4 to 5 levels of alpha on its edges, against 2 (fully crisp) at 24 px, with or without `shape-rendering="crispEdges"` (measured in the gallery's browser on November 16, 2026; that the inline SVG behaves the same is a hypothesis, not measured). 16 is the only grid that is crisp at 16, 24 and 48 px on a 2× screen; it is soft at 24 px, the default size, on a 1× screen.
- **More pixels did not draw a better icon.** The cog redrawn on 16 (`cog-16`) reads no better than the one on 12 (`cog-12`); the document gains a third line of text, the user a rounder head, nothing that changes recognition. The 24-grid drawings, to weigh what the 12s weigh, need two-pixel lines: they are the 12-grid drawings with half-steps, and lose at 16 px (0.67 device pixel per grid pixel on a 1× screen).
- **Pixel density.** The site's lab pages draw their icons at 24 px by default, and every explicit size they set is a multiple of 12 (24 px 13 times, 48 twice, 12, 36 and 96 once each, counted on November 16, 2026). At 24 px a 12-grid pixel is 2 CSS pixels: the pixel of a Forgeron Sans pixel title (`PixelTitle`, 7 rows to the em) set at 14 px. A 16-grid icon at 24 px would put 1.5-pixel squares next to 2-pixel letters: two pixel sizes side by side, which reads as a mistake in pixel art.
- **What popular pixel sets do.** pixelarticons (MIT) draws on a 24×24 viewBox but, in the SVGs checked, almost every number of the path data is even: all of them in `file-text` and `cloud`, 79 of 98 in `settings-cog`, 40 of 45 in `user`. In practice it draws on a 12-pixel grid with a few half-steps (measured from the Iconify SVGs on November 16, 2026). Its guidelines recommend display sizes that are multiples of the grid.
- **Cost.** At the time of the decision, 35 drawn icons and the site's lab icons were on 12.

**Use the sizes the grid divides**: 12, 24, 36, 48, 96 px for a 12-grid icon (16, 32, 48 for a 16-grid one). A 16 px slot works but is slightly soft on a 1× screen. If a product needs many crisp 16 px icons (the console's glyphs are 16 px today), the open option is a hand-drawn 16-grid variant of those icons, decided then, not a new base grid.

## Do and don't

The examples are rows of a 12×12 grid unless stated. `#` primary, `o` secondary, `.` empty.

### Draw the silhouette first; legibility beats detail

At 16 px a 12-grid pixel is barely more than one screen pixel. Keep what names the subject, drop the rest (Apple's and Slynyrd's advice alike: few distinctive traits, stop early).

```text
Don't: two meridians, two latitudes,   Do: one ring, one meridian, one
one-pixel gaps everywhere (old globe)  equator band (globe, 2026-11-16)
...######...                           ....####....
..#..##..#..                           ..###..###..
.#..#..#..#.                           ..#.#..#.#..
.oooooooooo.                           .#..#..#..#.
#..#....#..#                           .#oooooooo#.
#..#....#..#                           .#oooooooo#.
.oooooooooo.                           .#..#..#..#.
.#..#..#..#.                           ..#.#..#.#..
..#..##..#..                           ..###..###..
...######...                           ....####....
```

### Avoid long unbroken straight runs that are not the subject

A long horizontal or vertical run draws the eye and flattens the shape: a slot cut through a cloud, a bar across a cog, a ten-pixel row that makes a round thing square. A border is fine when the object has one (a table, a window); elsewhere break or shorten the run, or round the shape with steps.

```text
Don't: a 9-pixel slot through the mark    Do: a cut that ends in the gap,
(cloudflare, 16 grid, before)             under a domed cloud (after)
.......ooo......                          .......####.....
.....oooooo.....                          ......######....
..oooooooooo....                          ..##.########...
.ooooooooooo.##.                          .###########.oo.
.oooooooooo.####                          .##########.oooo
ooo.........####                          ####........oooo
ooooooooooo..###                          ###########ooooo
ooooooooooo#####                          ###########ooooo
```

### Keep proportions in check

- **Line weight against gaps against size**: a one-pixel line needs at least a one-pixel gap, and two where the grid allows (Lucide asks for two units between separate elements, at its scale). A gap thinner than the strokes around it closes at 16 px.
- **Count against grid**: teeth, rays, rows of text, bars. On 12 pixels, eight teeth fit only if each tooth and each gap is about two pixels. Five lines of text do not fit; two do.
- **Weight**: compare with `clock-01` and `lock` at 24 px. A solid shape needs a large hole or it becomes a blob; an outline must not look thinner than its neighbors.

### No orphan pixels, no one-pixel noise

A pixel touching nothing, or touching only by a corner where it should not, reads as dirt (cure's Pixel Joint tutorial calls a lone pixel noise; think in clusters). A checkerboard is gray noise at 16 px.

```text
Don't: a lone pixel as a "highlight"     Do: let the shape speak
..####......                             ..####......
.#....#.....                             .#....#.....
#..#...#....                             #......#....
#.......#...                             #......#....
```

The site's lab icons use a deliberate dither motif: dotted baselines (`bolt`, `chart`, `checkmark-square-01`) and checkered fills (`browser`, `chart`, `table`). It is a brand trait and is kept, but it degrades first at 16 px; do not add it to a new icon unless the icon sits next to those.

### Keep slopes clean: 1:1, 1:2, 2:1

Only horizontal, vertical and 45° lines are perfectly regular on a pixel grid; 2:1 and 1:2 steps stay steady. A slope that alternates step lengths makes jaggies (Derek Yu, the Lospec outline tutorial). On a curve, steps shorten steadily towards 45° and lengthen again: 4, 2, 1, 1, 2, 4, never 4, 1, 2, 1.

```text
Don't: uneven steps     Do: steady 2:1 steps   Do: 1:1
##........              ##........              #.........
..#.......              ..##......              .#........
...##.....              ....##....              ..#.......
.....#....              ......##..              ...#......
```

### One line weight

Choose one-pixel lines or solid shapes for the whole icon. A one-pixel outline with a two-pixel part reads as two icons glued together. The chevrons use two-pixel horizontal runs on a one-pixel diagonal: that is their weight everywhere, tip included.

### Make the duotone mean something

The secondary tone marks **one idea**: the spark of the anvil, the equator of the globe, the small cloud of a logo, the axle of a machine. Most icons need none. Do not use it for a tip, a corner or a random accent: on the old chevrons the secondary tip read as a stray orange pixel. Monotone must read on its own, because the secondary tone is often drawn at 40% opacity.

### Balance on the grid

- Center geometrically when the shape is symmetric; center optically when it is not. A down chevron carries its weight at the top: put it one row low. Apple's HIG gives the same advice for a download icon.
- A round shape can be drawn larger than a square one (Streamline's key-shape note): a circle that touches the edges looks the size of a square with a one-pixel margin.
- Odd-width strokes on an even grid cannot be centered exactly: accept half a pixel, do not draw a two-pixel stroke to hide it.

### No anti-aliasing tricks

Pixels are square and crisp: the renderer draws each run as a rectangle with `crispEdges`. Do not use the secondary tone at low opacity as fake anti-aliasing, and do not draw "gray" pixels: there is no gray in the data, only two tones. A curve is drawn with steps, not with shades.

## Worked case: the cog (`settings-01`)

The owner's verdict on the cog before November 16, 2026: too heavy, too blobby, too many teeth for the grid, "like the final boss of a video game".

```text
Before                  Rejected               After (adopted)
.....##.....            .....##.....           ...##..##...
.##.####.##.            .....##.....           ...######...
.##########.            .##.####.##.           ..########..
..###..###..            .###....###.           ####....####
.###....###.            ..#......#..           ###......###
####.oo.####            ..#..oo..#..           .##......##.
####.oo.####            ..#..oo..#..           .##......##.
.###....###.            ..#......#..           ###......###
..###..###..            .###....###.           ####....####
.##########.            .##.####.##.           ..########..
.##.####.##.            .....##.....           ...######...
.....##.....            .....##.....           ...##..##...
```

- **Before**: ten-pixel rows (rows 2 and 9) make the body a slab; the teeth are separated by one-pixel gaps that close at 16 px; a three-pixel rim and a small hole make it heavy; the secondary axle floats in the hole.
- **Rejected**: six thin teeth on a one-pixel ring. At 24 px it reads as a nut with legs: the teeth are too thin for their gaps.
- **After**: a two-pixel rim around a six-pixel hole (about a third of the body, like the reference's hub); eight one-pixel teeth set at 22.5°, so the notches fall on the diagonals and every gap is at least two pixels; no row longer than eight. Monotone: a cog has no second idea. It reads as a cog at 16 px and is as light as the ring icons next to it.

## Brand logos

A third-party mark is drawn to be **recognized**, not reinterpreted.

1. **Reference glyph**: the official logo, or its Iconify copy (`logos:<brand>` for color, `simple-icons:<brand>` for one tone, CC0 for the project, each mark staying its owner's trademark). Record which one in `reference`.
2. **Aspect ratio first.** Measure the mark's ratio and pick the grid where it fits with enough rows. Cloudflare's mark is 256 × 117 (2.19:1): on 12 it is 12 × 5 pixels and the cut cannot exist, so it uses 16 (16 × 8, 2:1).
3. **Rasterize, then redraw.** Sample the reference on the grid (cell centers) to get the masses, then redraw by hand what sampling loses: the parts that make the mark recognizable must survive even if exaggerated by a pixel, the details thinner than a pixel must be dropped or widened to one.
4. **Compare side by side** with the reference at 16, 24 and 48 px, and in monotone: the mark must still read in one tone, like the simple-icons version.
5. **Record** the `trademark` note in `CURATED` and keep the brand's colors out of the data (tones come from the consumer).

**Cloudflare, November 16, 2026.** What makes the mark: a large round dome right of center, a smaller bump on its left and a low tail; a thin cut that runs from the left into the gap between the two clouds; a smaller, lighter cloud on the right whose top is highest at its left. The old drawing was a straight raster: no bump, a nine-pixel slot, a block on the right. The new one keeps the dome (a standard eight-pixel circle top), marks the bump with a one-pixel notch, shortens the cut to eight pixels ending in the gap, and puts the small cloud in the secondary tone, which reads as the logo's lighter orange at the default 40% opacity. The small cloud is still more a stepped block than a quarter circle at 48 px: that is the limit of four pixels.

**GitHub, November 17, 2026.** The mark is round (1:1), so the ratio alone would fit 12, but on 12 the cell-center sample of `simple-icons:github` is a ring with a hole: the ears and the tail fall below one pixel. It uses 16. What makes the mark: a disc, the Octocat cut out of it with two pointed ears, a wide head, the tail curling in on the lower left and the body running out at the bottom edge. The first redraw kept the ears as one-pixel notches: next to the reference at 16 and 24 px they disappeared and the rim looked heavy on top. The adopted one makes the ears two pixels tall and the rim two rows thick above them. The tail is a two-pixel arm under a one-pixel gap: at 48 px it reads more as a notch than a curl, the limit of the grid. Monotone. GitHub's own logo guidelines were not read for this change: whether a pixel rendition is acceptable is the owner's decision, as for Cloudflare.

**Trademark caution.** Cloudflare's trademark page (read November 16, 2026) says that using its logo needs prior written permission, outside its web badges, and forbids modifying the marks. A pixel rendition is a modification. Whether the package may ship `cloudflare` is a decision for the owner, not for this guide.

## Sources of inspiration

| Source                                                  | Use it for                                                            | Licence                                                                                                      | Copy?                                                                |
| ------------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| Lucide and its icon design guide                        | rules of spacing, padding, optical balance, clarity first             | ISC (Lucide)                                                                                                 | Rules and ideas, not drawings.                                       |
| pixelarticons (halfmage)                                | how a popular pixel set solves a subject at about 12 effective pixels | MIT                                                                                                          | Inspiration only, no tracing.                                        |
| Pixel Icon Library (HackerNoon), Iconify prefix `pixel` | more pixel solutions, true 24 grid                                    | unclear: README says CC BY 4.0 for icons, `LICENSE` file is MIT, Iconify lists CC BY 4.0. Treat as CC BY 4.0 | Inspiration only.                                                    |
| Kenney Game Icons                                       | game-style pictograms                                                 | CC0                                                                                                          | Inspiration; copying would be allowed but would not match the style. |
| The web (photos, diagrams, other icon sets)             | what a subject looks like, which parts people recognize               | varies                                                                                                       | Look, close the tab, draw from memory of the parts. Never trace.     |

**Never** trace, sample or copy the pixels of another icon set. "Redrawn after" means: same idea and proportions, our own pixels, recorded in `reference`. A brand logo is the only thing that is rasterized, and only from the brand's own mark.

## Agent skills

Searched on November 16, 2026, in skills.sh, Tessl and a few skill directories. No published skill covers pixel icons written as rows of characters and judged by rendering; none is worth installing for this package. This guide and the gallery are the tools.

- `jezweb/icon-set-generator` (skills.sh, about 2,000 installs as listed): Lucide-like stroke icons in batches with an HTML preview at 24 and 48 px. Serious, but vector strokes. Its batch-and-preview idea is the one kept here.
- `tryopendata/svg-design` (skills.sh, about 310 installs): a substantial reference on stroke icon geometry; some rules are inconsistent (its margin is given as one and as two pixels). Reading, not installing.
- `omer-metin/pixel-art` (skills.sh, about 629 installs): useful sprite rules (no automatic anti-aliasing, no doubled pixels, silhouette test at 1×) mixed with internal errors and a game focus. Not installed.
- `wanshuiyin/pixel-art` (Tessl): README illustrations in `<rect>`s; its one rule worth keeping is "say when you cannot preview instead of drawing blind".
- Directory listings only, substance not checked: `jeremylongshore/svg-icon-generator`, `jmsktm/icon-designer`, AnastasiyaW `pixel-art-studio`, `pixel-art-advisor`, `pixel-art-scaler`, `joaquimscosta/icon-forge`, smithery `icon-development`.

## Sources

All read on November 16, 2026, unless stated. "Listing" means only a directory entry or a search snippet was seen.

1. Lucide, Icon design guide: https://lucide.dev/guide/design/icon-design-guide (read).
2. IBM Design Language, UI icons: Design (Carbon's base): https://www.ibm.com/design/language/iconography/ui-icons/design/ (read; integer coordinates, one stroke weight, 45° angles for even anti-aliasing).
3. Carbon, icon contribution pages: https://v10.carbondesignsystem.com/guidelines/icons/contribute (search snippet only; the current design page returned 404).
4. Material Design 1, Icons: https://m1.material.io/style/icons.html (read; older version, no longer maintained; m2 and m3 pages could not be read without JavaScript).
5. Material Symbols developer guide: https://developers.google.com/fonts/docs/material_symbols (read; optical size changes the stroke with display size).
6. Phosphor, homepage repository: https://github.com/phosphor-icons/homepage (README read; designed at 16 × 16 to stay legible small).
7. Streamline, Grids and key shapes: https://blog.streamlinehq.com/grids-and-keyshapes (read; undated blog post); 16 × 16 icons page: https://design.streamlinehq.com/16x16-icons (read; mostly a product page).
8. Apple Human Interface Guidelines, Icons: https://developer.apple.com/design/human-interface-guidelines/icons (read through its JSON data; simplicity, consistent weight, optical centering of bottom-heavy icons).
9. Microsoft Fluent 2, Iconography: https://fluent2.microsoft.design/iconography (read; dedicated sizes rather than scaling down).
10. pixelarticons: https://github.com/halfmage/pixelarticons and its CONTRIBUTING: https://raw.githubusercontent.com/halfmage/pixelarticons/master/CONTRIBUTING.md (read; 24 × 24 viewBox, paths only, no anti-aliasing or sub-pixel coordinates, avoid diagonal edges, display at multiples of 24).
11. Pixel Icon Library (HackerNoon): https://github.com/hackernoon/pixel-icon-library (README and LICENSE read; licence statements disagree).
12. Kenney, Game Icons: https://kenney.nl/assets/game-icons (read; CC0).
13. Derek Yu, Pixel Art Tutorial: https://www.derekyu.com/makegames/pixelart.html (read; updated 2020-01-28; jaggies, clean-up to one-pixel lines, no anti-aliasing on an outer edge over an unknown background).
14. cure, The Pixel Art Tutorial, Pixel Joint: https://pixeljoint.com/forum/forum_posts.asp?TID=11299 (read; 2010; jaggies, clusters, banding, pillow shading).
15. Lospec, Pixel Art Outlines Tutorial (skeddles, 2016): https://lospec.com/articles/pixel-art-outlines (read; equal segment lengths on a diagonal, steady shortening on a curve).
16. Tsugumo, So You Want To Be A Pixel Artist?, WPI copy: https://web.cs.wpi.edu/~claypool/courses/frontiers-06/samples/pixel-artist/faq.htm (read; about tiles and sprites, little for icons).
17. Slynyrd, Pixelblog 47, Tiny Pixels: https://www.slynyrd.com/blog/2023/11/26/pixelblog-47-tiny-pixels (read; keep only the traits that identify, stop early).
18. Pedro Medeiros, tutorials index: https://saint11.art/blog/pixel-art-tutorials/ (read, but the tutorials are images; his Medium articles returned 403).
19. Line slopes 1:1, 1:2, 2:1: https://community.aseprite.org/t/how-do-i-make-straight-curved-lines-properly/10246 and https://pixeljoint.com/Forum/forum_posts.asp?TID=20478 (search snippets only; sources 15 and 16 say the equivalent in full).
20. Cloudflare, Our Trademark Guidelines: https://www.cloudflare.com/trademark/ (read).
21. Simple Icons, DISCLAIMER: https://github.com/simple-icons/simple-icons/blob/develop/DISCLAIMER.md (read).
22. Iconify API previews used as references: `https://api.iconify.design/logos/cloudflare-icon.svg`, `https://api.iconify.design/simple-icons/cloudflare.svg`, and the pixelarticons and `pixel` SVGs whose coordinates were counted (fetched).
23. Agent skills: https://skills.sh/jezweb/claude-skills/icon-set-generator, https://skills.sh/tryopendata/skills/svg-design, https://skills.sh/omer-metin/skills-for-antigravity/pixel-art, https://tessl.io/registry/skills/github/wanshuiyin/Auto-claude-code-research-in-sleep/pixel-art (SKILL files or references read); the others listed above are listings.

## Changes of November 16, 2026

Redrawn by this protocol, judged in the gallery at 16, 24 and 48 px (names, exports and manifest entries unchanged):

| Icon                                               | Why                                                                   | Now                                                                                     |
| -------------------------------------------------- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `settings-01`                                      | heavy, one-pixel gaps between teeth                                   | the cog of the worked case, monotone                                                    |
| `cloudflare`                                       | did not read as the Cloudflare mark                                   | dome, bump, cut into the gap; tones swapped: large cloud primary, small cloud secondary |
| `globe`                                            | a scribble at 16 px                                                   | ring, one meridian, equator band                                                        |
| `layers-01`                                        | an outline and two chevrons blurred at 16 px                          | solid top sheet, two edges below                                                        |
| `arrow-down-01`, `arrow-left-01`, `arrow-right-01` | a secondary tip that read as a stray pixel; the down chevron sat high | one tone; the down chevron one row lower                                                |

Left as they are, for the owner to decide: `api` (braces with two dots can read as a face at 48 px) and the lab's dither motif in `bolt`, `browser`, `chart`, `checkmark-square-01`, `command-line` and `table`. The base grid did not change, so no other icon was migrated.
