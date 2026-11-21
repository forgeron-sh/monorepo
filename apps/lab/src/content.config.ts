import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { defineCollection } from "astro:content";
import { PAPERS } from "./data/papers";
import { rewriteMarkdownLinks } from "./lib/links";

/** The repository root: Astro runs from `apps/lab`. */
const ROOT = resolve(process.cwd(), "../..");

/** A repository path (`docs/blueprint/engine.md`) to its paper's page. */
const PAGES = new Map(PAPERS.map((p) => [`docs/${p.doc}.md`, `/papers/${p.slug}`]));

/**
 * The papers, read where they are written: the repository's `docs/`. Only the files listed in
 * `data/papers.ts` are published, their card (number, kind, date) lives there. Their links are
 * relative to the repository: a link to another paper leads to its page, any other file to GitHub.
 */
const papers = defineCollection({
  loader: {
    name: "lab-papers",
    async load({ store, renderMarkdown, generateDigest, watcher }) {
      store.clear();
      for (const p of PAPERS) {
        const path = `docs/${p.doc}.md`;
        const file = resolve(ROOT, path);
        const body = rewriteMarkdownLinks(await readFile(file, "utf8"), path, PAGES);
        store.set({
          id: p.doc,
          data: {},
          body,
          rendered: await renderMarkdown(body),
          digest: generateDigest(body),
        });
        watcher?.add(file);
      }
    },
  },
});

export const collections = { papers };
