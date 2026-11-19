import { readdirSync, readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import react from "@astrojs/react";
import { defineConfig } from "astro/config";

/**
 * The site's Blueprint library, as data: `virtual:blueprint-library` lists its `*.bp` files and
 * loads each one on demand (`virtual:blueprint-library/<name>`, a module per file, so the page
 * fetches only what it opens). The files are read at build time as data, never imported as
 * modules: no app imports another (`apps-do-not-import-each-other`). The day the library moves to
 * a package (`@forgeron/blueprint-library`, format.md §3), only `LIBRARY` changes.
 */
const LIBRARY = fileURLToPath(new URL("../site/src/illustrations/library/", import.meta.url));
const ID = "virtual:blueprint-library";

function blueprintLibrary() {
  const files = () =>
    readdirSync(LIBRARY)
      .filter((f) => f.endsWith(".bp"))
      .sort();
  return {
    name: "forgeron-blueprint-library",
    resolveId(id: string) {
      return id === ID || id.startsWith(`${ID}/`) ? `\0${id}` : undefined;
    },
    load(this: { addWatchFile(path: string): void }, id: string) {
      if (id === `\0${ID}`) {
        const list = files().map((name) => {
          const size = statSync(`${LIBRARY}${name}`).size;
          return `{ name: ${JSON.stringify(name)}, size: ${size}, load: () => import(${JSON.stringify(`${ID}/${name}`)}).then((m) => m.default) }`;
        });
        return `export const library = [\n${list.join(",\n")}\n];\n`;
      }
      if (id.startsWith(`\0${ID}/`)) {
        const name = id.slice(`\0${ID}/`.length);
        if (!files().includes(name)) return null;
        const path = `${LIBRARY}${name}`;
        this.addWatchFile(path);
        return `export default ${JSON.stringify(readFileSync(path, "utf8"))};\n`;
      }
      return undefined;
    },
  };
}

export default defineConfig({
  site: "https://ui.forgeron.sh",
  server: { port: 5181 },
  integrations: [react()],
  // The workspace packages ship as TypeScript sources: Vite compiles them.
  vite: {
    plugins: [blueprintLibrary()],
    ssr: {
      noExternal: [
        "@forgeron/ui",
        "@forgeron/icons",
        "@forgeron/blueprint",
        "@forgeron/blueprint-canvas",
        "@forgeron/canvas",
      ],
    },
  },
});
