# @forgeron/richtext-site

The site of the page editor `@forgeron/richtext`, served on `richtext.forgeron.sh`: a catalog of its plugins with a live demo of each, a playground, and a guide. The moon project id is `richtext-site`, because `packages/richtext` already takes `richtext`.

```sh
bun run --cwd apps/richtext dev     # http://localhost:5183
bun run --cwd apps/richtext build   # static output in dist/
bun apps/richtext/scripts/check-links.ts   # after a build: links, anchors, one page per plugin
```

## Pages

- `/`: what the editor is, an editor rebuilt from the plugins you tick (with its Markdown, JSON and text), the catalog by family.
- `/plugins`: every plugin by family. `/plugins/<id>`: summary, import lines for both halves, `requires`, options table, Markdown sample, notes, usage, and a live editor that has the plugin and what it requires.
- `/playground`: the full editor with plugin toggles, notes saved in `localStorage`, Markdown/JSON/Text output, and two editors collaborating on a Yjs document through an in-memory relay.
- `/use`: install, a minimal editor, picking plugins, `RichTextView`, collaboration, and how to write a plugin (two halves, slots; the worked example is `src/lib/callout.ts`, shown and run).

## How the catalog is found

- Docs: `src/lib/catalog.ts` merges `src/lib/builtin-docs.ts` (the bundled plugins) with every `PluginDoc[]` exported by a file of `packages/richtext/src/plugins/docs/*.ts` (`import.meta.glob`). `types.ts` and exports that are not arrays of documents are skipped. A docs file wins over the builtin text for the same id. A new docs file is a new page after a restart of the dev server or a build.
- Editor halves: `src/lib/registry.ts` reads every file of `packages/richtext/src/plugins/editor/` and keeps any export that has a `core` with an `id`; an export named `fooEditor` that is a function is taken as the factory of the plugin `foo` and called once with fake options. A plugin with no editor half has a page and no demo.
- Fake providers: `src/lib/demo-options.ts` (people, pages, tags, a timer-based upload that works or fails, an embed resolver). Options are matched by the names the docs give them (`pluginOptions.<plugin>.<name>` or a plain name); a name that matches nothing gets no value.

## Notes

- Editors are remounted (`key`) when the plugin list changes: rebuilding one in place throws "The editor view is not available" from the block handle.
- Plugin lists that break the registry (two owners of a node type) are refused with the message, not crashed.

## Release

Wired like the other sites: a Workers static-assets Worker, `forgeron-richtext`, whose `wrangler.jsonc` carries the custom domain `richtext.forgeron.sh` and serves `dist/`. Nothing in this folder deploys. `src/styles/lab.css` and `public/fonts` are copies of the other sites' (an app never imports another app).
