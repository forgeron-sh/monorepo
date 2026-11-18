import type { Atom } from "../types";

/** Gallery pages of the "record" blocks, in order. */
export const entries: ReadonlyArray<Atom> = [
  {
    slug: "property-panel",
    name: "Property panel",
    summary: "The properties of a record: a column of labelled pickers, or a row of chips.",
    imports: ["PropertyPanel", "PropertyText", "PropertyChips"],
    props: [
      {
        name: "rows",
        type: "({ label, control, hideLabel?, id? } | { heading })[]",
        description:
          "PropertyPanel: one row per property; a heading starts a group; hideLabel lets the control take the row under a heading that says it.",
      },
      {
        name: "label",
        type: "string",
        default: '"Properties"',
        description: "Names the panel, or the chips, for assistive technology.",
      },
      {
        name: "glyph / dim",
        type: "ReactNode / boolean",
        description: "PropertyText: a mark before a value that is read, not picked; greyed.",
      },
      {
        name: "children",
        type: "ReactNode",
        description: "PropertyChips: the pickers, each in its chip variant.",
      },
      { name: "className", type: "string", description: "Extra classes." },
    ],
  },
  {
    slug: "activity",
    name: "Activity",
    summary: "The timeline of a record: its changes, its comments, a box to write one.",
    imports: ["Activity", "CommentComposer"],
    props: [
      {
        name: "items",
        type: "ActivityItem[]",
        description:
          '{ kind: "event", author, text, time, glyph? } or { kind: "comment", author, body, time, quote?, highlighted? }, oldest first.',
      },
      {
        name: "time / dateTime",
        type: "string",
        description: '"2 h ago" as the caller words it; dateTime makes it a <time>.',
      },
      {
        name: "onSubmit",
        type: "(text: string) => void",
        description: "Shows the composer; the trimmed text on the button or ⌘↵.",
      },
      {
        name: "draft / onDraftChange",
        type: "string / (value: string) => void",
        description: "The composer's text, when the caller keeps it.",
      },
      {
        name: "title / actions",
        type: "string / ReactNode",
        default: '"Activity"',
        description: "The heading, and what sits at its end (Subscribe).",
      },
      {
        name: "submitLabel / placeholder",
        type: "string",
        default: '"Comment" / "Leave a comment…"',
        description: "The composer's button and empty text.",
      },
      { name: "className", type: "string", description: "Extra classes." },
    ],
  },
  {
    slug: "create-dialog",
    name: "Create dialog",
    summary: "Make a record from anywhere: title, description, properties, ⌘↵.",
    imports: ["CreateDialog", "Modal"],
    props: [
      {
        name: "open / onOpenChange",
        type: "boolean / (open: boolean) => void",
        description: "Kept by the caller; Escape, a press outside and Close ask to close.",
      },
      {
        name: "onSubmit",
        type: "(draft: { title, description, createMore }) => void",
        description: "On the button or ⌘↵, once a title is written.",
      },
      {
        name: "trigger",
        type: "ReactElement",
        description: "A button that opens it; focus returns to it.",
      },
      {
        name: "heading / context",
        type: "string / ReactNode",
        default: '"New issue"',
        description: "What is made, and where: a team chip before it.",
      },
      {
        name: "properties",
        type: "ReactNode",
        description: "The pickers in their chip variant, in a row.",
      },
      {
        name: "createMore / onCreateMoreChange",
        type: "boolean",
        default: "false",
        description: "Keeps the dialog open and empties it after each creation.",
      },
      {
        name: "title / description",
        type: "string",
        description: "With their onChange, when the caller keeps the draft.",
      },
      {
        name: "submitLabel",
        type: "string",
        default: '"Create issue"',
        description: "The primary button.",
      },
      {
        name: "footerStart",
        type: "ReactNode",
        description: "At the left of the footer: attach a file.",
      },
    ],
  },
];
