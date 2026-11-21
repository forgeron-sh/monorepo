# @forgeron/font-site

The specimen and download site of **Forgeron Sans**, the pixel typeface of the brand, served on `font.forgeron.sh`.

```sh
bun run --cwd apps/font dev     # http://localhost:5180
bun run --cwd apps/font build   # static output in dist/
```

## Pages

Everything is built from the three files in `public/fonts`.

- `/`: the hero (a dithered reveal of the name), `/0.1` the construction plate and metrics, `/0.2` the glyph set (each glyph opens its grid, name and code point), `/0.3` the sharp sizes, `/0.4` the face in use, `/0.5` the licence.
- `/playground`: the type tester: text, presets, weight, sharp sizes only, colours, pixel grid.
- Modals: download options (each OTF, `OFL.txt`, the archive, sizes, SHA-256) from the navbar; licence details from `/0.5`.
- `/OFL.txt` and `/downloads/ForgeronSans-<version>.zip`, written at build time.

## How it reads the font

`src/lib/otf.ts` is a small OpenType-CFF reader (table directory, `head`, `hhea`, `OS/2`, `name`, `cmap`, `hmtx`, CFF charset and charstrings). Forgeron Sans has straight outlines only, so the reader knows moves and lines and refuses anything else. `src/lib/raster.ts` finds the grid unit of the outlines and turns them back into pixels; `src/lib/specimen.ts` assembles what the pages need and writes the archive (`src/lib/zip.ts`, stored entries and a fixed date, so its checksum is stable from one build to the next). `src/lib/reveal.ts` computes the hero's reveal frame by frame.

The tests (`src/lib/*.test.ts`) check the reader against the shipped files, including that Bold is Regular emboldened by one pixel and Medium by half a pixel, glyph by glyph.

## Licence

The SIL Open Font License 1.1, copyright forgeron.sh, no Reserved Font Name. `src/config/licence.ts` is the single place to change it: the licence modal, `/OFL.txt` and the copy inside the archive all read it.

## The files

`public/fonts/ForgeronSans-*.otf` are copies of the files generated with the face's former name: their `name` table still says "Forge Sans" and carries no licence record, and no generator for them is in the repository. Replace the three files when a release built under the new name exists; the pages read names, metrics and checksums from whatever files are there.

## Design

The lab design language of the site and the icon gallery, with pixel icons from `@forgeron/icons`. An app cannot import another app, so `src/styles/lab.css` (with the landing's bento and spacer) is a copy (the hero's dither field comes from `@forgeron/shaders`), and the nav, section head and footer follow the gallery's components. They should move to a shared package once the lab design is settled. Every control on a row has the height `--ctl-h`.
