// The documentation of the reference kinds as data: pages, tags and dates. All three are kinds of
// the generic `reference` node `{ kind, id, label }` of the `references` plugin, which they require;
// none is in a preset, an app lists the ones it wants. No React, no Tiptap: types only.

import type { PluginDoc } from "./types";

export const referencesDocs: PluginDoc[] = [
  {
    id: "pages",
    family: "references",
    name: "Pages",
    summary:
      "A link to another page of the app, typed with `[[`. The app gives the search; the chip is a reference of the kind `page`, and the static view makes it a link when the app gives an address.",
    core: "@forgeron/richtext/plugins/pages",
    editor: "@forgeron/richtext/plugins/editor/pages",
    requires: ["references"],
    options: [
      {
        name: "search",
        type: "(query: string) => ReferenceItem[] | Promise<ReferenceItem[]>",
        description:
          "The pages that match what was typed after `[[` (a fixed list, or a search on a server). Each item is `{ id, label, hint? }`. Editor half only.",
      },
      {
        name: "href",
        type: "(ref: Reference) => string | undefined",
        description:
          "The address of a page, for the static view: the chip becomes a link. An unsafe address (`javascript:`) is dropped. Give it to both halves.",
        default: "none (a chip)",
      },
      {
        name: "label",
        type: "string",
        description: "The menu's accessible name.",
        default: '"Link a page"',
      },
      {
        name: "empty",
        type: "string",
        description: "What the menu says when nothing matches.",
        default: '"No page matches"',
      },
    ],
    markdown: "See [Launch plan](ref:page:p_1) for the details.",
    notes: [
      "The menu stays open across spaces, since titles have them: Escape or a pick closes it.",
      "In the editor the chip is not a link (a click places the caret); the app opens a page from `onReferences` or its own handler on `[data-kind=page]`.",
      "A page the app no longer knows stays in the document as its label: the editor never checks that an id exists.",
      "Without the plugin a `page` reference is still shown, as the generic chip.",
    ],
    usage: `import { RichTextEditor, RichTextView } from "@forgeron/richtext/react";
import { contentPlugins } from "@forgeron/richtext/plugins/editor";
import { pagesEditor } from "@forgeron/richtext/plugins/editor/pages";
import { pagesPlugin } from "@forgeron/richtext/plugins/pages";
import { fullCorePlugins } from "@forgeron/richtext/plugins";

const href = (ref) => \`/pages/\${ref.id}\`;
const plugins = [
  ...contentPlugins,
  pagesEditor({ search: (q) => api.searchPages(q), href }), // module scope: a new list rebuilds the editor
];
<RichTextEditor plugins={plugins} defaultValue={doc} />;

// Read-only places: the same \`href\` on the core half, no editor loaded.
const cores = [...fullCorePlugins, pagesPlugin({ href })];
<RichTextView value={doc} plugins={cores} />;`,
  },
  {
    id: "tags",
    family: "references",
    name: "Tags",
    summary:
      "An inline `#tag` chip, a reference of the kind `tag`. The app gives the candidates and may let the writer create a new tag from the typed text.",
    core: "@forgeron/richtext/plugins/tags",
    editor: "@forgeron/richtext/plugins/editor/tags",
    requires: ["references"],
    options: [
      {
        name: "search",
        type: "(query: string) => ReferenceItem[] | Promise<ReferenceItem[]>",
        description:
          "The tags that match what was typed after `#`. Without it only creation is offered. Editor half only.",
      },
      {
        name: "onCreate",
        type: "(label: string) => ReferenceItem | null | Promise<ReferenceItem | null>",
        description:
          "Makes a new tag from the typed text and returns it (the app saves it). When given, the menu offers `Create #text` unless a tag has that label. `null` cancels and leaves the text. Editor half only.",
      },
      {
        name: "href",
        type: "(ref: Reference) => string | undefined",
        description: "Where a tag leads in the static view. Give it to both halves.",
        default: "none (a chip)",
      },
      {
        name: "label",
        type: "string",
        description: "The menu's accessible name.",
        default: '"Tag"',
      },
      {
        name: "empty",
        type: "string",
        description: "What the menu says when nothing matches.",
        default: '"No tag matches"',
      },
    ],
    markdown: "Ship it [urgent](ref:tag:t_1)",
    notes: [
      "The label is stored without the `#`; the chip and the plain text add it. Markdown keeps the generic form, `[label](ref:tag:id)`.",
      "With an asynchronous `onCreate` the typed text stays until the tag comes back; if the text was edited meanwhile, the chip is inserted at the caret.",
      "A `#` at the start of a line followed by a space still makes a heading (the menu closes on the space).",
      "Creating is the app's business: the editor reports the new reference through `onReferences` like any other.",
    ],
    usage: `import { RichTextEditor } from "@forgeron/richtext/react";
import { contentPlugins } from "@forgeron/richtext/plugins/editor";
import { tagsEditor } from "@forgeron/richtext/plugins/editor/tags";

const plugins = [
  ...contentPlugins,
  tagsEditor({
    search: (q) => api.searchTags(q),
    onCreate: async (label) => api.createTag(label), // -> { id, label }
  }),
];
<RichTextEditor plugins={plugins} defaultValue={doc} onReferences={({ added }) => track(added)} />;`,
  },
  {
    id: "dates",
    family: "references",
    name: "Dates",
    summary:
      "An inline date chip, typed with `!`: shortcuts (`!today`, `!tomorrow`, `!friday`, `!+3`, a typed `2026-12-01`) or a small calendar with an optional time, built from the Calendar and TimePicker of `@forgeron/ui`.",
    core: "@forgeron/richtext/plugins/dates",
    editor: "@forgeron/richtext/plugins/editor/dates",
    requires: ["references"],
    options: [
      {
        name: "format",
        type: "(parts: { date: string; time?: string }) => string",
        description:
          "The label a new chip stores and shows (`Nov 20, 2026`). Days are `YYYY-MM-DD`, times `HH:mm`. Editor half only.",
        default: "the ISO form: `2026-11-20`, `2026-11-20 14:30`",
      },
      {
        name: "isPast",
        type: "(parts: { date: string; time?: string }) => boolean",
        description:
          "Marks a chip `fg-rt-past` (an overdue date) when it returns true. Pure; `isPastDate(parts, now)` is a ready one. Give it to both halves; the editor evaluates it when the document changes.",
        default: "never",
      },
      {
        name: "today",
        type: "() => Date",
        description:
          "The clock for `!today` and the calendar: a server time, or a test's. Editor half only.",
        default: "() => new Date()",
      },
      {
        name: "words",
        type: "{ today?, tomorrow?, yesterday?, nextWeek?, pick? }",
        description: "The names of the menu rows, to translate them. Editor half only.",
        default: "English",
      },
      {
        name: "label",
        type: "string",
        description: "The menu's accessible name.",
        default: '"Insert a date"',
      },
    ],
    markdown:
      "Due [2026-11-20](ref:date:2026-11-20), review at [2026-11-21 14:30](ref:date:2026-11-21T14:30)",
    notes: [
      "The id is the ISO day, with `THH:mm` when there is a time; that is what apps read (`referencesOf`, `onReferences`). The label is only what was shown when it was written.",
      "A shortcut is resolved when picked: the chip holds the day, never the word `today`.",
      "No time zone: days and times are as the writer's device saw them.",
      "The static view draws a `<time datetime>`; an id that is not a real date is shown as the generic chip.",
      'The calendar panel is the interface plugin `datesPanel` of `@forgeron/richtext/react` (it needs React; the dates plugin itself does not, so a server builds the schema). Without it the "Pick a date" row opens nothing; the shortcuts and typed dates still work.',
      "`!` opens only after a space or at a line start, and never inside code. The calendar has the keyboard of the ui Calendar; Escape closes the panel.",
    ],
    usage: `import { RichTextEditor, RichTextView, datesPanel } from "@forgeron/richtext/react";
import { contentPlugins } from "@forgeron/richtext/plugins/editor";
import { datesEditor } from "@forgeron/richtext/plugins/editor/dates";
import { datesPlugin, isPastDate } from "@forgeron/richtext/plugins/dates";
import { fullCorePlugins } from "@forgeron/richtext/plugins";

const isPast = (parts) => isPastDate(parts);
const plugins = [
  ...contentPlugins,
  datesEditor({ isPast, format: ({ date, time }) => (time ? \`\${date} at \${time}\` : date) }),
  datesPanel, // draws the calendar behind "Pick a date"; without it the shortcuts still work
];
<RichTextEditor plugins={plugins} defaultValue={doc} />;

<RichTextView value={doc} plugins={[...fullCorePlugins, datesPlugin({ isPast })]} />;`,
  },
];
