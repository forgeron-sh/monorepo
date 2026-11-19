/**
 * The Blueprint library: the site's scenes as `.bp` files (this folder, `control/` included),
 * read by the site, the UI gallery and the parity tests. A file is imported by its path, through
 * `@forgeron/blueprint/vite`:
 *
 *   import file from "@forgeron/libraries/blueprints/erp-village.bp";             // as written
 *   import compiled from "@forgeron/libraries/blueprints/erp-village.bp?compiled"; // SceneBin
 *   import meta from "@forgeron/libraries/blueprints/control/stack6.bp?meta";      // no bytes
 *
 * `library` lists the top-level files (not `control/`) as text, each loaded on demand: a module
 * per file, so a page fetches only what it opens, and no Blueprint plugin is needed to list them.
 */

/** A file of the library, read when opened. */
export interface LibraryFile {
  /** Its name, "erp-village.bp". */
  name: string;
  /** Its text. */
  load: () => Promise<string>;
}

const FILES = import.meta.glob<string>("./*.bp", { query: "?raw", import: "default" });

/** Every top-level file of the library, by name. */
export const library: readonly LibraryFile[] = Object.entries(FILES)
  .map(([path, load]) => ({ name: path.slice("./".length), load }))
  .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
