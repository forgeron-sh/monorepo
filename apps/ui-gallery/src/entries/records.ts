import type { Atom } from "../types";

/** Gallery pages of the "records" blocks: one description of a record's fields, many views. */
export const entries: ReadonlyArray<Atom> = [
  {
    slug: "record-list",
    name: "Record list",
    summary:
      "Any records in foldable groups, one dense row each, drawn from their field definitions. IssueList is its preset.",
    imports: [
      "RecordList",
      "defineFields",
      "recordGroups",
      "useRecordView",
      "issueFields",
      "projectFields",
      "RecordListGroup",
      "RecordListHeader",
      "RecordListToggle",
      "RecordListAdd",
      "RecordListRows",
      "RecordListRow",
      "RecordRow",
    ],
    props: [
      {
        name: "fields",
        type: "RecordFields<R>",
        description:
          "From defineFields<R>({ key: { label, kind, get, options?, set?, place? } }): the one description of the record.",
      },
      {
        name: "groups",
        type: "{ key, name, glyph?, records }[]",
        description: "recordGroups(fields, records, 'status'), or useRecordView().groups.",
      },
      {
        name: "context",
        type: "{ people?, labels?, today? }",
        description: "What person and labels fields choose from, and today for late dates.",
      },
      {
        name: "properties / titleField",
        type: "string[] / string",
        default: `all but hidden / "title"`,
        description: "The fields each row shows, and the one written as its title.",
      },
      {
        name: "selectionMode",
        type: `"single" | "multiple"`,
        default: `"single"`,
        description:
          "Multiple: a selection (⌘ click, Shift, ⌘A, Escape) with selection / onSelectionChange and a selectionActions bar.",
      },
      {
        name: "onRecordChange / editors",
        type: "(id, patch) => void / { [field]: false | options }",
        description: "Editing in place: each shown field becomes its kind's picker.",
      },
      {
        name: "renderRow",
        type: "(record, surface) => ReactNode",
        description: "Draws a row yourself; the groups, arrows and selection stay.",
      },
      {
        name: "children",
        type: "ReactNode",
        description:
          "The parts, in place of the groups drawn from groups: RecordListGroup (group) with RecordListHeader (RecordListToggle, RecordListAdd) and RecordListRows of RecordListRow (record). The list keeps the state; each part takes className, the element's attributes, a data-slot and asChild.",
      },
    ],
  },
  {
    slug: "record-board",
    name: "Record board",
    summary: "Any records as cards in columns of a groupable field. IssueBoard is its preset.",
    imports: [
      "RecordBoard",
      "recordGroups",
      "projectFields",
      "RecordBoardColumn",
      "RecordBoardColumnHeader",
      "RecordBoardColumnToggle",
      "RecordBoardColumnActions",
      "RecordBoardCards",
      "RecordBoardCard",
      "RecordBoardAdd",
      "RecordCard",
    ],
    props: [
      {
        name: "columns",
        type: "{ key, name, glyph?, records }[]",
        description: "recordGroups(fields, records, field, context, { keepEmpty: true }).",
      },
      {
        name: "renderCard / renderExtra",
        type: "(record, surface) => ReactNode / (record) => ReactNode",
        description: "Draws a card yourself, or adds chips at its end.",
      },
      {
        name: "onAdd / onColumnMenu",
        type: "(key) => void",
        description: "A + and a ⋯ in each header.",
      },
      {
        name: "children",
        type: "ReactNode",
        description:
          "The parts, in place of the columns drawn from columns: RecordBoardColumn (column) with RecordBoardColumnHeader (RecordBoardColumnToggle, RecordBoardColumnActions) and RecordBoardCards of RecordBoardCard (record) and RecordBoardAdd.",
      },
    ],
  },
];
