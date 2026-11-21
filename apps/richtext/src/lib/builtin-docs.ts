// The documentation of the plugins that ship with @forgeron/richtext today, written from their
// sources (ids, Markdown, what the editor halves read). The plugins that arrive later bring their
// own `PluginDoc`s in `packages/richtext/src/plugins/docs/*.ts`, which `catalog.ts` merges in.

import type { PluginDoc } from "@forgeron/richtext/plugins/docs/types";

const EDITOR = "@forgeron/richtext/plugins/editor";

const text = (
  id: string,
  name: string,
  summary: string,
  markdown: string,
  notes: string[],
): PluginDoc => ({
  id,
  family: "text",
  name,
  summary,
  core: "@forgeron/richtext/plugins/marks",
  editor: EDITOR,
  markdown,
  notes,
  usage: `import { ${id}, placeholder, bubble } from "${EDITOR}";

const plugins = [placeholder, ${id}, bubble]; // module scope: a new list rebuilds the editor
<RichTextEditor plugins={plugins} defaultValue={doc} />;`,
});

export const builtinDocs: ReadonlyArray<PluginDoc> = [
  {
    id: "core",
    family: "core",
    name: "Core",
    summary:
      "Paragraphs, text and hard breaks: the document with nothing else. Always in the list, you never add it yourself; it also carries the history (Yjs's own when collaborating) and the box that shows what no plugin knows.",
    core: "@forgeron/richtext/plugins/core",
    editor: EDITOR,
    markdown: "A paragraph.\\\nA hard break inside it.",
    notes: [
      "The editor adds it in front of whatever list you give (`withCoreEditor`).",
      "A node type no plugin knows is kept as is in the JSON and shown as an Unsupported block, then written as the text it holds in Markdown.",
      "With `collaboration`, ProseMirror's history is dropped: Yjs keeps its own.",
    ],
    usage: `import { RichTextEditor } from "@forgeron/richtext/react";

// Nothing but the core: paragraphs and text.
<RichTextEditor plugins={[]} defaultValue={doc} />;`,
  },
  {
    id: "placeholder",
    family: "core",
    name: "Placeholder",
    summary: "A hint in the empty block under the cursor. The text is the `placeholder` prop.",
    core: "@forgeron/richtext/plugins/ui",
    editor: EDITOR,
    options: [
      {
        name: "placeholder",
        type: "string",
        description: "The hint, a prop of the editor.",
        default: '"Type / for blocks"',
      },
    ],
    notes: ["Shown only in the block the cursor is in."],
    usage: `import { placeholder } from "${EDITOR}";

<RichTextEditor plugins={[placeholder]} placeholder="Write something" />;`,
  },
  text(
    "bold",
    "Bold",
    "Strong text. Shortcut `Mod-B`; `**bold**` and `__bold__` are read.",
    "Some **bold** text.",
    ["Written as `**` in Markdown, drawn as `<strong>`."],
  ),
  text(
    "italic",
    "Italic",
    "Emphasised text. Shortcut `Mod-I`; `*italic*` and `_italic_` are read.",
    "Some *italic* text.",
    ["Written as `*` in Markdown, drawn as `<em>`."],
  ),
  text(
    "strike",
    "Strikethrough",
    "Struck-through text, `~~strike~~` in Markdown.",
    "~~Old~~ new.",
    ["Drawn as `<s>`."],
  ),
  text(
    "underline",
    "Underline",
    "Underlined text. Markdown has no word for it, so it is written as an inline `<u>` tag.",
    "An <u>underlined</u> word.",
    ["Other Markdown readers show the tag as text: it is the one mark with no standard form."],
  ),
  text(
    "code",
    "Inline code",
    "Code inside a line, between backticks. Longer runs of backticks carry code that holds one.",
    "Call `toMarkdown(doc)` here.",
    ["No other mark applies inside it; drawn as `<code>`."],
  ),
  {
    id: "link",
    family: "text",
    name: "Link",
    summary:
      "A link on a piece of text. Selecting text opens a one-field panel in the selection toolbar (shortcut `Mod-K`). Only safe URLs are drawn by the static view.",
    core: "@forgeron/richtext/plugins/marks",
    editor: EDITOR,
    markdown: "Read [the docs](https://forgeron.sh).",
    notes: [
      "A `javascript:` URL is dropped by `toHtml`, `toTree` and `<RichTextView>`.",
      'Links open with `rel="noopener noreferrer nofollow"` in the static view.',
      "The panel of the selection toolbar needs the `bubble` plugin.",
    ],
    usage: `import { link, bubble, placeholder } from "${EDITOR}";

<RichTextEditor plugins={[placeholder, link, bubble]} defaultValue={doc} />;`,
  },
  {
    id: "heading",
    family: "blocks",
    name: "Headings",
    summary: "Three levels of heading, `Heading 1` to `Heading 3` in the slash menu.",
    core: "@forgeron/richtext/plugins/heading",
    editor: EDITOR,
    markdown: "# Title\n\n## Subtitle\n\n### Section",
    notes: [
      "A heading is a paragraph turned into another block: `#`, `##` and `###` then a space do it while typing.",
      "In Markdown, `####` and deeper are read as level 3.",
    ],
    usage: `import { heading, slash, placeholder } from "${EDITOR}";

<RichTextEditor plugins={[placeholder, heading, slash]} defaultValue={doc} />;`,
  },
  {
    id: "listItem",
    family: "blocks",
    name: "List item",
    summary:
      "The item a bulleted, numbered or to-do list holds. It owns the node only; the three list plugins require it.",
    core: "@forgeron/richtext/plugins/lists",
    editor: EDITOR,
    notes: ["Add a list plugin, not this one: they bring it through `requires`."],
    usage: `import { bulletList, listItem } from "${EDITOR}";

const plugins = [listItem, bulletList];`,
  },
  {
    id: "bulletList",
    family: "blocks",
    name: "Bulleted list",
    summary: "A list with bullets, nested to any depth. `-`, `*` or `+` then a space starts one.",
    core: "@forgeron/richtext/plugins/lists",
    editor: EDITOR,
    requires: ["listItem"],
    markdown: "- first\n- second\n  - nested",
    notes: [
      "Whichever list plugin is present reads every list kind that is present in Markdown.",
      "`Tab` and `Shift-Tab` nest and lift an item.",
    ],
    usage: `import { bulletList, listItem, slash } from "${EDITOR}";

<RichTextEditor plugins={[listItem, bulletList, slash]} defaultValue={doc} />;`,
  },
  {
    id: "orderedList",
    family: "blocks",
    name: "Numbered list",
    summary: "A numbered list, nested to any depth. `1.` then a space starts one.",
    core: "@forgeron/richtext/plugins/lists",
    editor: EDITOR,
    requires: ["listItem"],
    markdown: "1. first\n2. second\n   1. nested",
    notes: ["The start number of a list is kept."],
    usage: `import { listItem, orderedList, slash } from "${EDITOR}";

<RichTextEditor plugins={[listItem, orderedList, slash]} defaultValue={doc} />;`,
  },
  {
    id: "taskList",
    family: "blocks",
    name: "To-do list",
    summary: "A checklist whose items check off. `[ ]` then a space starts one.",
    core: "@forgeron/richtext/plugins/lists",
    editor: EDITOR,
    markdown: "- [ ] to do\n- [x] done",
    notes: [
      "It brings its own item type: it does not need the list item plugin.",
      "In `<RichTextView>` the boxes are shown, not clickable.",
    ],
    usage: `import { taskList, slash } from "${EDITOR}";

<RichTextEditor plugins={[taskList, slash]} defaultValue={doc} />;`,
  },
  {
    id: "blockquote",
    family: "blocks",
    name: "Quote",
    summary: "A quotation that holds other blocks. `>` then a space starts one.",
    core: "@forgeron/richtext/plugins/blockquote",
    editor: EDITOR,
    markdown: "> A quote\n>\n> - with a list inside",
    notes: ["Holds any block the editor has, not only text."],
    usage: `import { blockquote, slash } from "${EDITOR}";

<RichTextEditor plugins={[blockquote, slash]} defaultValue={doc} />;`,
  },
  {
    id: "codeBlock",
    family: "blocks",
    name: "Code block",
    summary:
      "A block of code with an optional language, between fences. Three backticks then a space start one.",
    core: "@forgeron/richtext/plugins/code-block",
    editor: EDITOR,
    markdown: '```ts\nconst page = fromMarkdown("# Hello");\n```',
    notes: [
      "The language is kept as an attribute; there is no syntax colouring in the editor.",
      "The fence is made longer than any run of backticks the code holds.",
    ],
    usage: `import { codeBlock, slash } from "${EDITOR}";

<RichTextEditor plugins={[codeBlock, slash]} defaultValue={doc} />;`,
  },
  {
    id: "horizontalRule",
    family: "blocks",
    name: "Divider",
    summary: "A horizontal rule between two blocks. `---` then a space makes one.",
    core: "@forgeron/richtext/plugins/divider",
    editor: EDITOR,
    markdown: "Above\n\n---\n\nBelow",
    notes: ["The slash entry is called Divider; `***` and `___` are read too."],
    usage: `import { horizontalRule, slash } from "${EDITOR}";

<RichTextEditor plugins={[horizontalRule, slash]} defaultValue={doc} />;`,
  },
  {
    id: "table",
    family: "blocks",
    name: "Table",
    summary:
      "A grid of rows and columns with a header row, and a toolbar over it to add and remove rows and columns. GFM tables in Markdown.",
    core: "@forgeron/richtext/plugins/table",
    editor: EDITOR,
    markdown: "| Plugin | Adds |\n| --- | --- |\n| table | rows and columns |",
    notes: [
      "The toolbar over a table is drawn by the `blockToolbar` plugin; without it the table has no toolbar.",
      "Cells hold one paragraph: Markdown cannot say more. A hard break inside a cell is written `<br>`.",
    ],
    usage: `import { table, blockToolbar, slash } from "${EDITOR}";

<RichTextEditor plugins={[table, slash, blockToolbar]} defaultValue={doc} />;`,
  },
  {
    id: "image",
    family: "media",
    name: "Image",
    summary:
      "A picture as a block. The editor does not choose the picture: the app gives it a way to ask for one, a file picker or an upload.",
    core: "@forgeron/richtext/plugins/image",
    editor: EDITOR,
    options: [
      {
        name: "requestImage",
        type: "() => Promise<{ src: string; alt?: string } | null>",
        description:
          "A prop of the editor. Resolves the picture to insert, or `null` to cancel. Without it the Image entry is not in the slash menu.",
      },
    ],
    markdown: '![Forgeron](/favicon.svg "The anvil")',
    notes: [
      "The static view shows only safe sources: http(s), relative paths and `data:image`.",
      "Base64 sources are accepted by the editor; store pictures in your own storage and keep a URL.",
    ],
    usage: `import { image, slash } from "${EDITOR}";

<RichTextEditor
  plugins={[image, slash]}
  requestImage={async () => ({ src: await upload(), alt: "A picture" })}
/>;`,
  },
  {
    id: "references",
    family: "references",
    name: "References (user)",
    summary:
      "An inline pointer to a thing of your app: a person, a page, a tag. The plugin owns the node; the app gives, per kind, a trigger character and the candidates. The legacy `@` mention is the kind `user`.",
    core: "@forgeron/richtext/plugins/references",
    editor: EDITOR,
    options: [
      {
        name: "mentions",
        type: "ReadonlyArray<MentionItem>",
        description: "A fixed list of people, `@`. Sugar for a provider of the kind `user`.",
      },
      {
        name: "onMentionQuery",
        type: "(query: string) => MentionItem[] | Promise<MentionItem[]>",
        description: "People found for what was typed, for a search on a server.",
      },
      {
        name: "references",
        type: "ReadonlyArray<ReferenceProvider>",
        description:
          "A provider per kind: `{ kind, char?, label?, empty?, items(query) }`. `char` defaults to `@`.",
      },
      {
        name: "onReferences",
        type: "(change: { added; removed; all }) => void",
        description:
          "After each edit that changed them, the references added or removed since the last report: notify people from here.",
      },
    ],
    markdown: "Thanks [@Ada Lovelace](mention:ada), see [Roadmap](ref:page:p42).",
    notes: [
      "A reference is `{ kind, id, label }`. Markdown writes `[@Label](mention:id)` for a user and `[Label](ref:kind:id)` for the rest.",
      "Old documents with `mention` nodes are read as references.",
      "`referencesOf(doc)` and `diffReferences(before, after)` do the same on saved documents, outside any editor.",
      "Without a provider, the trigger character is just a character.",
    ],
    usage: `import { references } from "${EDITOR}";

<RichTextEditor
  plugins={[references]}
  mentions={[{ id: "ada", label: "Ada Lovelace" }]}
  references={[{ kind: "page", char: "#", items: searchPages }]}
  onReferences={({ added }) => notify(added)}
/>;`,
  },
  {
    id: "slash",
    family: "interface",
    name: "Slash menu",
    summary:
      "Type `/` in an empty paragraph to insert a block. Its entries are the `blocks` of every plugin in the list, so it grows with the editor.",
    core: "@forgeron/richtext/plugins/ui",
    editor: EDITOR,
    notes: [
      "It is a suggestion built from the plugins' `core.blocks`: an entry appears only if its plugin is there (and, for the image, if the editor can ask for a picture).",
      "It never opens inside code or a title: a paragraph only.",
    ],
    usage: `import { bold, slash } from "${EDITOR}";

<RichTextEditor plugins={[bold, slash]} />;`,
  },
  {
    id: "bubble",
    family: "interface",
    name: "Selection toolbar",
    summary:
      "A toolbar above a text selection. The mark plugins add their buttons (and the link its one-field panel); with no plugin to fill it, it is empty and not drawn.",
    core: "@forgeron/richtext/plugins/ui",
    editor: EDITOR,
    options: [
      {
        name: "bubble",
        type: "boolean",
        description: "A prop of the editor: `false` hides the toolbar. Default `true`.",
        default: "true",
      },
    ],
    notes: ["Slot `bubble`: any plugin can add a `ToolbarItem`."],
    usage: `import { bold, italic, bubble } from "${EDITOR}";

<RichTextEditor plugins={[bold, italic, bubble]} />;`,
  },
  {
    id: "blockHandle",
    family: "interface",
    name: "Block handle",
    summary:
      "A + and a grip at the left of a block: add a block below, drag to move, and a menu to turn into, move up or down, duplicate and delete.",
    core: "@forgeron/richtext/plugins/ui",
    editor: EDITOR,
    options: [
      {
        name: "blockHandle",
        type: "boolean",
        description: "A prop of the editor: `false` hides the handle. Default `true`.",
        default: "true",
      },
    ],
    notes: [
      "Slot `handle`: a plugin can add actions to the block menu. Turn into lists the plugins' `turnable` blocks.",
      "Real drag-and-drop by hand and touch are not verified.",
    ],
    usage: `import { blockHandle, heading, slash } from "${EDITOR}";

<RichTextEditor plugins={[heading, slash, blockHandle]} />;`,
  },
  {
    id: "blockToolbar",
    family: "interface",
    name: "Block toolbar",
    summary:
      "A toolbar over the block the cursor is in. The table plugin adds the row and column buttons of its own.",
    core: "@forgeron/richtext/plugins/ui",
    editor: EDITOR,
    notes: ["Slot `blockToolbar`: a plugin gives a node name and the buttons to show over it."],
    usage: `import { table, blockToolbar, slash } from "${EDITOR}";

<RichTextEditor plugins={[table, slash, blockToolbar]} />;`,
  },
];
