# @forgeron/richtext

A Notion-like rich text editor for any app: notes pages, a task description, comments. **Tiptap 3 (ProseMirror) in headless mode, MIT**, with our own interface on top (`@forgeron/ui`, pixel icons) and **Yjs wired in**, so real-time collaboration plugs in later without reshaping anything. We write no editing engine of our own, and nothing here knows an app.

Internal package; the API is not frozen.

## Layers

```text
 @forgeron/richtext            core: no React, no ProseMirror, no Yjs, no DOM
   model                       the document as ProseMirror-compatible JSON; normalizeDoc, parseDoc, constructors
   blocks                      the block catalog (id, label, keywords, icon name) and filterBlocks, the slash menu's filter
   markdown                    toMarkdown / fromMarkdown, pure, round-trip tested
   text                        toPlainText
   render                      toHtml / toTree: the static renderer (escaped, safe URLs only)

 @forgeron/richtext/react      the editor and its interface
   <RichTextEditor>            value / defaultValue / onChange as JSON, variant "full" | "minimal", editable, placeholder,
                               mentions / onMentionQuery, requestImage, collaboration
   <RichTextView>              read-only, on the static tree: no ProseMirror loaded
   SlashMenu · BubbleToolbar · BlockHandle · MentionList · TableToolbar

 @forgeron/richtext/collab     Yjs, no React (also re-exported from /react)
   createYDoc · toYDoc · fromYDoc      JSON <-> Y.Doc
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

Collaboration: `collaboration={{ doc, provider, user }}` makes the editor read and write the Y.Doc (ProseMirror's history is dropped, `value` is ignored: seed the doc with `toYDoc(json)`). `provider` is anything with an `awareness` (y-websocket, Hocuspocus, `createLocalSync` peers) and shows the other carets.

Boundaries (`.dependency-cruiser.cjs`): the core imports neither React, nor Tiptap, ProseMirror or Yjs, nor ui, nor a Node module (`scripts/richtext-boundary.test.ts` for the third-party half); richtext imports no other editor, and ui does not import richtext.

The live demo is `/editors/richtext` in the UI gallery: the full page, the minimal field, the read-only view and two editors on two Y.Docs.
