import type { Atom, PropRow } from "../types";

const className: PropRow = { name: "className", type: "string", description: "Extra classes." };

/** Gallery pages of the Diff primitive: a text diff, a record's fields, two versions (D-157). */
export const entries: ReadonlyArray<Atom> = [
  {
    slug: "diff-view",
    name: "Diff view",
    summary:
      "What changed between two texts or two records: unified or side by side, words marked.",
    imports: [
      "DiffView",
      "FieldDiff",
      "structureDiffRows",
      "structureDiffSeq",
      "structureDiffFields",
    ],
    props: [
      {
        name: "before / after",
        type: "string",
        description:
          "DiffView: the older and the newer text. Compared by lines (Myers), words marked inside a changed line.",
      },
      {
        name: "mode / defaultMode / onModeChange",
        type: `"unified" | "split"`,
        default: `"unified"`,
        description: "The layout.",
      },
      {
        name: "context",
        type: "number",
        default: "3",
        description: "Unchanged lines kept around a change.",
      },
      {
        name: "collapse",
        type: "boolean",
        default: "true",
        description: "Fold the longer runs: a button shows them.",
      },
      { name: "beforeLabel / afterLabel", type: "string", description: "Names the sides: v2, v4." },
      { name: "bare", type: "boolean", description: "No counts and no layout switch." },
      {
        name: "FieldDiff: before / after",
        type: "Record<string, unknown>",
        description:
          "The fields of two records. Nested ones by path (address.city), lists joined, added, removed and changed told in words as well as colour.",
      },
      {
        name: "FieldDiff: labels",
        type: "Record<string, string>",
        description: "The name shown for a key.",
      },
      {
        name: "FieldDiff: showUnchanged",
        type: "boolean",
        default: "false",
        description: "A button shows the fields that did not change.",
      },
      className,
    ],
  },
  {
    slug: "version-compare",
    name: "Version compare",
    summary: "The versions of a document or record in a list: pick two and see what changed.",
    imports: ["VersionCompare"],
    props: [
      {
        name: "versions",
        type: "CompareVersion[]",
        description:
          "Newest first: { id, label, at, by, note?, content }. content is a string (text diff) or a record (field diff).",
      },
      {
        name: "from / defaultFrom / onFromChange",
        type: "string",
        description: "The older side. Default: the version before the right one.",
      },
      {
        name: "to / defaultTo / onToChange",
        type: "string",
        description: "The newer side. Default: the current version.",
      },
      {
        name: "onRestore",
        type: "(id) => void",
        description: "Makes an older version the current one; leave out on a read-only record.",
      },
      {
        name: "labels",
        type: "Record<string, string>",
        description: "Names of the fields, for records.",
      },
      {
        name: "mode / defaultMode / onModeChange",
        type: `"unified" | "split"`,
        description: "The text diff layout.",
      },
      className,
    ],
  },
];
