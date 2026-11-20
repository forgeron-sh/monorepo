// The documentation of the layout family as data: one entry per plugin, for a catalog (the site,
// the gallery) to list the same way as every other plugin. No React, no Tiptap.

import type { PluginDoc } from "./types";

const SETUP = `import { RichTextEditor } from "@forgeron/richtext/react";
import { fullEditorPlugins } from "@forgeron/richtext/plugins/editor";
import { layoutPlugins } from "@forgeron/richtext/plugins/editor/layout";
import { fullCorePlugins } from "@forgeron/richtext/plugins";
import { layoutPlugins as layoutCores } from "@forgeron/richtext/plugins/layout";

// Opt-in: none of them is in a preset. Module scope: a new list rebuilds the editor.
const plugins = [...fullEditorPlugins, ...layoutPlugins];
<RichTextEditor plugins={plugins} defaultValue={doc} />;

// Everywhere else (Markdown, plain text, the read-only view) the same list as core halves:
const cores = [...fullCorePlugins, ...layoutCores];
toMarkdown(doc, cores);
<RichTextView value={doc} plugins={cores} />;`;

export const layoutDocs: PluginDoc[] = [
  {
    id: "callout",
    family: "layout",
    name: "Callout",
    summary:
      "A highlighted block with a tone (note, info, success, warning, danger) and an optional emoji icon, holding any blocks. A small toolbar over it switches the tone.",
    core: "@forgeron/richtext/plugins/callout",
    editor: "@forgeron/richtext/plugins/editor/callout",
    options: [
      {
        name: "node attrs",
        type: '{ tone: "note" | "info" | "success" | "warning" | "danger"; icon?: string }',
        description:
          "`tone` picks the colour and the pixel icon (default `note`, an unknown value reads as `note`); `icon` is any emoji string and replaces the tone's icon.",
        default: '{ tone: "note" }',
      },
      {
        name: "editor.commands.setCallout",
        type: "(attrs?: { tone?: CalloutTone; icon?: string }) => boolean",
        description: 'Wraps the selected blocks in a callout. The slash entry "Callout" does it.',
      },
      {
        name: "editor.commands.setCalloutTone",
        type: "(tone: CalloutTone) => boolean",
        description:
          "Sets the tone of the callout the cursor is in (the nearest one when they are nested). The toolbar over the callout does it.",
      },
      {
        name: "editor.commands.setCalloutIcon",
        type: "(icon: string | null) => boolean",
        description:
          "Sets the emoji icon of the callout the cursor is in, `null` goes back to the tone's pixel icon. For an icon picker of your own: list `emojiPicker.search(query)` and call this with the pick.",
      },
    ],
    markdown: `> [!WARNING]
> Back up before you migrate.
>
> - the database
> - the uploads

> [!INFO] 💡
> An icon follows the tag.`,
    notes: [
      "Markdown is the alert syntax of GitHub and Obsidian, `> [!NOTE]` then quoted lines. Any other reader shows a plain quote with the tag on its first line, so the content stays readable; with the quote plugin missing the callout plugin reads those lines itself, and with the callout plugin missing they read as a quote.",
      "Tones are written `NOTE`, `INFO`, `SUCCESS`, `WARNING`, `DANGER`, read in any case. GitHub's own `TIP`, `IMPORTANT` and `CAUTION` are read as `success`, `info` and `danger` and written back under the canonical name. GitHub itself draws only its five names: `INFO` and `SUCCESS` show as a quote there.",
      "An emoji icon is written after the tag (`> [!INFO] 💡`): a short run with no letter or digit is an icon, any other text after the tag is read as the first paragraph.",
      "The icon of a tone is drawn by CSS (`layout.css`, a mask of a pixel icon), in the editor and in the static view alike; an emoji is plain text in the same slot.",
      "The toolbar has no icon field: the editor's block toolbar draws buttons only. The built-in control is `Reset icon`; setting an icon is `setCalloutIcon`, which an app wires to its own picker.",
      "Not in `fullCorePlugins`: pass the plugin to `toMarkdown`, `fromMarkdown`, `toPlainText` and `RichTextView` as well as to the editor.",
    ],
    usage: SETUP,
  },
  {
    id: "toggle",
    family: "layout",
    name: "Toggle",
    summary:
      "A collapsible block: a summary line and the blocks it hides, with a chevron. The open state is part of the document.",
    core: "@forgeron/richtext/plugins/toggle",
    editor: "@forgeron/richtext/plugins/editor/toggle",
    options: [
      {
        name: "node attrs",
        type: "{ open: boolean }",
        description:
          "Whether the blocks after the summary are shown. A toggle made from the slash menu starts open.",
        default: "{ open: false }",
      },
      {
        name: "editor.commands.setToggle",
        type: "() => boolean",
        description:
          "Turns the text block under the cursor into a toggle whose summary is that text, with an empty block below.",
      },
      {
        name: "editor.commands.toggleOpen",
        type: "(open?: boolean) => boolean",
        description: "Opens or closes the toggle the cursor is in; `open` forces a state.",
      },
    ],
    markdown: `<details open>
<summary>Why a toggle?</summary>

Any blocks, **marks** and lists go inside.

</details>`,
    notes: [
      "The open state is an attribute of the node, so it is stored in the document: with collaboration everyone sees the toggle open or closed together, and the one who clicks changes it for the others. It is not a per-person view state. In an editor that is not editable the chevron changes only that editor's own view, and the document, the Y.Doc and the other people are untouched.",
      "Opening or closing is not put on the undo stack of a plain editor. With Yjs the undo manager records it like any change to the shared document, so an undo may reopen a toggle.",
      "Enter in the summary moves what follows the caret into the first block and opens the toggle; Backspace at the start of the summary turns the toggle back into a paragraph and its blocks. A caret inside what is about to be hidden moves to the summary.",
      "Hidden blocks are only hidden by CSS: they stay in the document, in search, in plain text and in the Markdown. Keyboard navigation can still enter them in some browsers (not verified).",
      "Markdown is the HTML every reader knows, `<details>` and `<summary>` on a line of its own; an unclosed `<details>` is left as text. The static view is a native `<details>` element, so a read-only page folds without a script.",
      "The summary holds inline content only (marks, references); blocks go below it. A summary that contains `</summary>` is written with a backslash.",
    ],
    usage: SETUP,
  },
  {
    id: "columns",
    family: "layout",
    name: "Columns",
    summary:
      "Two to four columns of blocks side by side; they stack into one column when their container is narrow.",
    core: "@forgeron/richtext/plugins/columns",
    editor: "@forgeron/richtext/plugins/editor/columns",
    options: [
      {
        name: "slash entries",
        type: '"2 columns" | "3 columns" | "4 columns"',
        description:
          "Insert a block of that many empty columns after the current block (or in place of an empty one), the caret in the first.",
      },
      {
        name: "editor.commands.insertColumns",
        type: "(count: number) => boolean",
        description:
          "Inserts `count` columns (clamped to 2 to 4). It does nothing inside a column: columns do not nest.",
      },
      {
        name: "editor.commands.addColumn / removeColumn",
        type: "() => boolean",
        description:
          "Add an empty column after the one the cursor is in (up to 4), or remove it with what it holds (down to 2). The toolbar over the block has the same buttons, and Delete for the whole block.",
      },
    ],
    markdown: `<!-- columns -->

First column.

<!-- column -->

Second column, with a list:

- one
- two

<!-- /columns -->`,
    notes: [
      "Markdown puts the columns one after the other, each after an HTML comment, so every reader shows the content in reading order and none shows the markers. This plugin reads the comments back into columns; an unclosed `<!-- columns -->` stays as text.",
      "Narrow screens: the block is a CSS container (`container-type: inline-size`) and its grid folds to one column when that container is narrower than 36rem. It is the width of the block, not of the window, that decides, so columns also stack in a side panel. The static view and the editor use the same rules.",
      "The schema accepts any number of columns from one; the buttons and commands keep to 2 to 4. In a shared document two people can add a column at once and the merged block may hold five: it stays valid and shows five columns, and the buttons then only remove.",
      "Columns do not nest through the menu (a column cannot receive a columns block); a document that nests them (a Markdown import, a paste) still reads and writes correctly.",
      "Backspace at the start of a column does not pull it into the previous one.",
      "Not verified: dragging a block between columns with a real pointer, the stacked layout on a real phone.",
    ],
    usage: SETUP,
  },
  {
    id: "toc",
    family: "layout",
    name: "Table of contents",
    summary:
      "A block that lists the headings of the page, live, each a link to its heading. It stores nothing but its place.",
    core: "@forgeron/richtext/plugins/toc",
    editor: "@forgeron/richtext/plugins/editor/toc",
    options: [
      {
        name: "slugify / uniqueSlugs / tocEntries",
        type: "(text: string) => string; (texts: string[]) => string[]; (doc: RichNode) => TocEntry[]",
        description:
          "The id of a heading is its text as a slug (`Hello, World!` is `hello-world`), numbered when taken (`intro`, `intro-1`, `intro-2`), the same in the editor and the static view. `tocEntries` gives `{ id, level, text }` for every heading that has text, nested ones included, for an outline of your own.",
      },
    ],
    markdown: `[TOC]`,
    notes: [
      "Heading ids are derived from the text each time they are shown: the editor puts them on the headings as decorations, the static view as `id` attributes. The stored JSON of a heading is the same with or without this plugin, and a renamed heading changes its id (an old link to it stops working).",
      "The static view needs the whole document to list its headings (`toHtml(doc)`, `RichTextView`); a table of contents rendered alone shows `No headings yet`. The ids are given to the heading elements in order, and only when the number of `h1` to `h3` elements equals the number of heading nodes.",
      "The list reads `heading` nodes; without the heading plugin they are shown as unsupported blocks and the links have no target.",
      "Empty headings are left out. Levels are indented in CSS, `data-level` on each item.",
      "In the editor a click on a link moves the caret to the heading and scrolls it into view; in the static view it is an ordinary `#id` link. It follows edits of other people in a shared document.",
      "Markdown is `[TOC]` on its own line, which several readers (GitLab, Typora, python-markdown) expand into a list; the others show it as text. Plain text writes nothing.",
      "The ids are not made unique across several editors on one page.",
    ],
    usage: SETUP,
  },
  {
    id: "emoji",
    family: "layout",
    name: "Emoji",
    summary:
      "Type `:` and a name to pick an emoji; the character is inserted as plain text. The data is exported as `emojiPicker`, for a callout or page icon of your own.",
    core: "@forgeron/richtext/plugins/emoji",
    editor: "@forgeron/richtext/plugins/editor/emoji",
    options: [
      {
        name: "emojiPicker.search",
        type: "(query: string, limit?: number) => EmojiEntry[]",
        description:
          "Entries (`{ char, name, keywords, group }`) whose name or keywords match every word of the query, best first; an empty query gives the common ones.",
      },
      {
        name: "emojiPicker.find / all / groups / group / common",
        type: "(nameOrChar) => EmojiEntry | undefined; EmojiEntry[]; string[]; (name) => EmojiEntry[]; () => EmojiEntry[]",
        description:
          "The whole table, its groups, a lookup by `:name:` or character, and the common ones.",
      },
    ],
    markdown: `Shipped 🎉`,
    notes: [
      "No node: the document holds the Unicode character in an ordinary text run, so Markdown, plain text, search and every reader show it as is. Nothing is stored about how it was picked.",
      "The menu opens on `:` after a space or at the start of a line, not inside a word, a URL (`http:`), a time (`10:30`) or a code block. Before anything is typed it offers a few common ones; it closes at the next space.",
      "About 550 emoji, each with a snake_case name and keywords, in one module (`plugins/emoji-data`) that only this plugin and `emojiPicker` import: an app that uses neither does not load it. No dependency. It is a compact set of common emoji, not the whole of Unicode: no skin tones, no flags, no multi-part sequences.",
      "Emoji look different on each platform; the character is the same.",
      "Typing `:smile:` in Markdown is not converted: only the picker inserts emoji.",
    ],
    usage: `import { RichTextEditor } from "@forgeron/richtext/react";
import { fullEditorPlugins } from "@forgeron/richtext/plugins/editor";
import { emoji } from "@forgeron/richtext/plugins/editor/emoji";
import { emojiPicker } from "@forgeron/richtext/plugins/emoji";

const plugins = [...fullEditorPlugins, emoji];
<RichTextEditor plugins={plugins} defaultValue={doc} />;

// An icon picker of your own, for a callout (editor.commands.setCalloutIcon) or a page:
const hits = emojiPicker.search("rocket"); // [{ char: "🚀", name: "rocket", ... }]
editor.commands.setCalloutIcon(hits[0].char);`,
  },
];
