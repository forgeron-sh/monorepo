# @forgeron/richtext

A Notion-like rich text editor for any app: notes pages, a task description, comments. **Tiptap 3 (ProseMirror) in headless mode, MIT**, with our own interface on top (`@forgeron/ui`, pixel icons) and **Yjs wired in**, so real-time collaboration plugs in later without reshaping anything. We write no editing engine of our own, and nothing here knows an app.

The editor is **as basic as possible, and every feature is a plugin** (D-152). The core is a document of paragraphs, text and line breaks, with a history; bold, links, headings, lists, quote, code, table, image, references, the slash menu, the toolbars are plugins, bundled here, and a third party writes its own the same way.

Internal package; the API is not frozen.

## Layers

```text
 @forgeron/richtext            core: no React, no ProseMirror, no Yjs, no DOM
   model                       the document as ProseMirror-compatible JSON; normalizeDoc, parseDoc, constructors
   plugin                      the plugin contract (core half), resolvePlugins, createRegistry
   blocks                      the slash catalog composed from the plugins, filterBlocks
   markdown                    toMarkdown / fromMarkdown, pure, round-trip tested
   text · render               toPlainText · toHtml / toTree: the static renderer (escaped, safe URLs only)
   references                  referencesOf, diffReferences: what a document points at

 @forgeron/richtext/plugins            the core halves of the bundled plugins and the presets (no editor)
   .../plugins/marks · lists · heading · blockquote · code-block · divider · table · image · references · ui
 @forgeron/richtext/plugins/editor     their editor halves (Tiptap extensions, commands, React interface)
   .../plugins/editor/marks · lists · heading · ...      one subpath per family, same names

 @forgeron/richtext/react      the editor and its interface
   <RichTextEditor>            value / defaultValue / onChange as JSON, variant, plugins, editable, placeholder,
                               mentions / onMentionQuery / references / onReferences, requestImage, collaboration
   <RichTextView>              read-only, on the static tree and the core halves: no ProseMirror loaded
   BubbleToolbar · BlockHandle · BlockToolbars · SuggestionMenu     the hosts of the slots

 @forgeron/richtext/collab     Yjs, no React (also re-exported from /react)
   createYDoc · toYDoc · fromYDoc      JSON <-> Y.Doc, with the schema of the plugins you give
   createLocalSync                     N documents linked by an in-memory relay (tests, the gallery, offline-first)
```

Import the styles once, after those of ui: `import "@forgeron/richtext/styles.css"`.

## Example

```tsx
import { RichTextEditor, RichTextView } from "@forgeron/richtext/react";
import { toMarkdown, toPlainText } from "@forgeron/richtext";

<RichTextEditor
  defaultValue={doc}
  onChange={save}
  mentions={people}
  placeholder="Type / for blocks"
/>;
<RichTextEditor variant="minimal" value={comment} onChange={setComment} />; // marks, lists, mentions
<RichTextView value={doc} />; // read-only places: no editor loaded
```

`variant` is sugar for a list of plugins (`editorPresets.full`, `editorPresets.minimal`). The list is the whole configuration:

```tsx
import {
  bold,
  bulletList,
  listItem,
  placeholder,
  slash,
  bubble,
} from "@forgeron/richtext/plugins/editor";

const plugins = [placeholder, bold, listItem, bulletList, slash, bubble]; // module scope: a new list rebuilds the editor
<RichTextEditor plugins={plugins} defaultValue={doc} />;

// Everywhere else the same list, as core halves, drives Markdown, plain text and the static view:
const cores = plugins.map((p) => p.core);
toMarkdown(doc, cores); // a node no plugin knows is written as the text it holds
```

Every function of the core (`toMarkdown`, `fromMarkdown`, `toHtml`, `toTree`, `toPlainText`, `normalizeDoc`, `parseDoc`, `blocksFor`) takes the plugins as its last argument and defaults to the `full` preset's core halves, so a call that names none reads and writes everything the bundled plugins know.

## Plugins

A plugin has two halves, so a read-only place never loads ProseMirror.

**The core half** (`CorePlugin`, framework-free: no React, Tiptap, ProseMirror, Yjs or ui): `id`, `name`, `description`, `requires` (ids of plugins that must be in the list), the JSON `nodes` and `marks` it owns with their rules (Markdown, plain text, static view), its slash `blocks` (id, label, keywords, icon name, group, shortcut), Markdown readers (`markdown.blocks`, `markdown.inline`), and `migrate` for old node types.

**The editor half** (`EditorPlugin`): `core`, the Tiptap `extensions`, and what it contributes to the **slots** of the interface:

| Slot           | A plugin adds                                                         | Drawn by the plugin |
| -------------- | --------------------------------------------------------------------- | ------------------- |
| `slash`        | how each of its `core.blocks` acts (`blocks`, `turnable`)             | `slash`             |
| `bubble`       | buttons above a selection (`ToolbarItem`, with a `field` for a link)  | `bubble`            |
| `handle`       | actions of the block menu (`HandleAction`)                            | `blockHandle`       |
| `blockToolbar` | a toolbar over the block the cursor is in (`BlockToolbar`, a table's) | `blockToolbar`      |
| `suggestion`   | a trigger character and its provider (`SuggestionSpec`)               | the editor          |
| `ui`           | React components next to the writing area                             | the editor          |

A node view is a Tiptap node view in `extensions`. Without the plugin that draws a slot (`bubble`, `blockHandle`...), that part of the interface is simply not there. Two plugins that own the same node or mark type, a duplicate id, a missing dependency and a cycle are refused with a `PluginError`.

A plugin of your own, in its own file:

```ts
export const calloutCore = definePlugin({
  id: "callout",
  name: "Callout",
  description: "A highlighted box.",
  nodes: {
    callout: {
      markdown: (n, w) => `:::callout\n${w.blocks(n.content ?? [])}\n:::`,
      render: (n, w) => [el("aside", {}, w.children(n))],
    },
  },
  blocks: [{ id: "callout", label: "Callout", keywords: ["note"], icon: "quote", group: "text" }],
  markdown: { blocks: [/* a BlockReader for :::callout */] },
});
export const callout = defineEditorPlugin({
  core: calloutCore,
  extensions: [CalloutNode], // a Tiptap node
  blocks: {
    callout: {
      apply: ({ editor, range }) => void startChain(editor, range).wrapIn("callout").run(),
    },
  },
});
```

Unknown types degrade, they never crash: a node no plugin of this editor knows is kept as is in the JSON (`parseDoc(value, plugins, { unknown: "keep" })`; the editor does it), shown as an "Unsupported block" box in the editor and the static view, and written as the text it holds in Markdown and plain text. The Markdown parser reads only what the plugins in the list read.

## References

A **reference** is an inline `{ kind, id, label }` pointing at a thing of the app: a person, a page, a tag. The `references` plugin provides the node; the app provides, per kind, a trigger character and the candidates (`references={[{ kind: "page", char: "#", items }]}`). The legacy mention is the kind `user` (`mentions` and `onMentionQuery` are sugar for its provider): old documents with `mention` nodes are read as references, and `[@Label](mention:id)` stays its Markdown form (other kinds: `[Label](ref:kind:id)`).

`onReferences({ added, removed, all })` reports, after each edit that changed them, the references added or removed since the last report, so an app can notify people; the editor knows nothing about notifications. `referencesOf(doc)` and `diffReferences(before, after)` do the same on saved documents.

Collaboration: `collaboration={{ doc, provider, user }}` makes the editor read and write the Y.Doc (ProseMirror's history is dropped, `value` is ignored: seed the doc with `toYDoc(json, field, plugins)`). `provider` is anything with an `awareness` (y-websocket, Hocuspocus, `createLocalSync` peers) and shows the other carets. Pass the same `plugins` to `toYDoc` and `fromYDoc` as to the editors: the schema is made from them.

Boundaries (`.dependency-cruiser.cjs`): the core, and the core halves of the plugins (`src/plugins/*.ts`), import neither React, nor Tiptap, ProseMirror or Yjs, nor ui, nor an editor half, nor a Node module (`scripts/richtext-boundary.test.ts` for the third-party half, which also checks that `/collab`, `tiptap/` and the editor halves load no React); richtext imports no other editor, and ui does not import richtext.

The live demo is `/editors/richtext` in the UI gallery: the full page, the minimal field, the read-only view, two editors on two Y.Docs, and the plugins toggled one by one.
