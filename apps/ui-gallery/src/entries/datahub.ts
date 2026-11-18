import type { Atom } from "../types";

const shared = {
  fields: {
    name: "fields",
    type: "DataField[]",
    description:
      "{ id, name, type, primary?, required?, unique?, readOnly?, defaultValue?, description?, choices?, relation?: { table, multiple? }, decimals? }.",
  },
  relations: {
    name: "relations",
    type: "Record<table, { id, label, hint? }[]>",
    description: "The records relation fields can point at, by table: their labels and the picker.",
  },
  className: { name: "className", type: "string", description: "Extra classes." },
};

/** Gallery pages of the "datahub" blocks, in order. */
export const entries: ReadonlyArray<Atom> = [
  {
    slug: "record-grid",
    name: "Record grid",
    summary:
      "Records as a sheet, edited in place: arrows, Enter or F2, type to replace, Escape, Tab, Delete.",
    imports: ["RecordGrid"],
    props: [
      { name: "label", type: "string", description: "Names the grid: the table name." },
      shared.fields,
      {
        name: "records",
        type: "{ id, values: Record<fieldId, CellValue> }[]",
        description: "The rows. A list type (multi-select, relation, file) holds a string[].",
      },
      shared.relations,
      {
        name: "onChange",
        type: "(recordId, fieldId, value) => void",
        description:
          "Turns editing on. A typed value goes through parseValue: a wrong one stays in the cell with its problem.",
      },
      {
        name: "selectable",
        type: "boolean",
        default: "false",
        description: "A checkbox per row and in the header; Shift+Space toggles the current row.",
      },
      {
        name: "selection / defaultSelection",
        type: "string[]",
        description: "The selected record ids. Controlled or not.",
      },
      {
        name: "onSelectionChange",
        type: "(ids: string[]) => void",
        description: "When a box is ticked.",
      },
      {
        name: "onOpenRecord",
        type: "(id) => void",
        description:
          "An expand button per row, and Shift+Enter: open it in a Drawer with RecordForm.",
      },
      { name: "onAddRecord", type: "() => void", description: "A New record row at the end." },
      { name: "onAddField", type: "() => void", description: "A + after the last column." },
      {
        name: "sort / onSortChange",
        type: `{ field, direction: "asc" | "desc" } | null`,
        description: "Headers become buttons that cycle ascending, descending, none.",
      },
      {
        name: "fieldMenu / onFieldAction",
        type: "(field) => ActionMenuEntry[]",
        description: "The actions of a column, behind a ⋯ in its header.",
      },
      {
        name: "active / defaultActive",
        type: "{ record, field } | null",
        description: "The current cell. Controlled or not, with onActiveChange.",
      },
      {
        name: "widths",
        type: "Record<fieldId, number>",
        description: "Column widths in px; by type otherwise.",
      },
      {
        name: "showNull",
        type: "boolean",
        default: "false",
        description: "Writes NULL in empty cells, as a database editor does.",
      },
      {
        name: "markEdited",
        type: "boolean",
        default: "true",
        description: "An ember corner on the cells changed since the grid was shown.",
      },
      {
        name: "empty",
        type: "ReactNode",
        default: `"No records yet"`,
        description: "Shown with no record.",
      },
      shared.className,
    ],
  },
  {
    slug: "record-form",
    name: "Record form",
    summary: "A record as a form generated from its fields: typed controls, problems, ⌘↵ saves.",
    imports: ["RecordForm"],
    props: [
      shared.fields,
      {
        name: "value / defaultValue",
        type: "Record<fieldId, CellValue>",
        description: "The values. Controlled or not; a new record starts from the defaults.",
      },
      { name: "onChange", type: "(values) => void", description: "Every change." },
      {
        name: "onSubmit",
        type: "(values) => void",
        description: "Once every field is valid; the problems show under the fields otherwise.",
      },
      { name: "onCancel", type: "() => void", description: "Adds a Cancel button." },
      {
        name: "mode",
        type: `"create" | "edit"`,
        default: `"create"`,
        description: "Edit keeps the primary key read only.",
      },
      shared.relations,
      {
        name: "errors",
        type: "Record<fieldId, string>",
        description: "Problems from the server (UNIQUE constraint failed), shown with the others.",
      },
      {
        name: "submitLabel",
        type: "string",
        default: `"Add record" / "Save"`,
        description: "The words of the save button.",
      },
      {
        name: "footer",
        type: "ReactNode",
        description: "At the left of the foot: an Add another box, a Delete button.",
      },
      shared.className,
    ],
  },
  {
    slug: "field-type-picker",
    name: "Field type picker",
    summary: "One field type among thirteen, each with its pixel glyph and its SQLite storage.",
    imports: ["FieldTypePicker", "FieldTypeGlyph", "FIELD_TYPES"],
    props: [
      {
        name: "value / defaultValue",
        type: "FieldType",
        description:
          "text, longText, number, boolean, date, datetime, select, multiSelect, relation, file, email, url, json.",
      },
      { name: "onChange", type: "(type) => void", description: "When a type is chosen." },
      { name: "types", type: "FieldType[]", default: "all", description: "The types offered." },
      {
        name: "showStorage",
        type: "boolean",
        default: "true",
        description: "TEXT, REAL, INTEGER at the end of each row.",
      },
      { name: "label", type: "string", default: `"Type"`, description: "Names the control." },
      {
        name: "variant",
        type: `"field" | "chip"`,
        default: `"field"`,
        description: "A form control, or a chip in a row.",
      },
      shared.className,
    ],
  },
  {
    slug: "field-editor",
    name: "Field editor",
    summary: "One field: name, type, the options of its type, required, unique, its default value.",
    imports: ["FieldEditor"],
    props: [
      {
        name: "value / defaultValue",
        type: "DataField",
        description: "The field. Controlled or not.",
      },
      { name: "onChange", type: "(field) => void", description: "Every change." },
      {
        name: "onSubmit",
        type: "(field) => void",
        description: "Once the name, the choices and the default are valid.",
      },
      { name: "onCancel / onDelete", type: "() => void", description: "Buttons in the foot." },
      {
        name: "tables",
        type: "{ value, label }[]",
        description: "The tables a relation can point at.",
      },
      shared.relations,
      {
        name: "takenNames",
        type: "string[]",
        description: "The other fields' names: a name must not repeat one.",
      },
      { name: "types", type: "FieldType[]", default: "all", description: "The types offered." },
      {
        name: "namePattern",
        type: "RegExp | null",
        default: "snake_case",
        description: "The shape of a name; null for any.",
      },
      {
        name: "submitLabel",
        type: "string",
        default: `"Save field"`,
        description: "The words of the save button.",
      },
      shared.className,
    ],
  },
  {
    slug: "schema-fields",
    name: "Schema fields",
    summary:
      "The fields of a table: glyph, name, type, rules as chips. Drag or Alt + arrows to reorder.",
    imports: ["SchemaFields"],
    props: [
      {
        name: "fields / defaultFields",
        type: "DataField[]",
        description: "The fields in order. Controlled or not; the primary key stays first.",
      },
      {
        name: "onReorder",
        type: "(fields) => void",
        description: "Turns reordering on: a handle per row, and Alt + ↑ ↓, announced.",
      },
      { name: "onOpen", type: "(id) => void", description: "A click or Enter on a field." },
      { name: "selected", type: "string | null", description: "The field shown as open." },
      { name: "onAdd", type: "() => void", description: "An Add a field button at the end." },
      {
        name: "fieldMenu / onFieldAction",
        type: "(field) => ActionMenuEntry[]",
        description: "The ⋯ of a field, right click, Shift+F10.",
      },
      {
        name: "showDescriptions",
        type: "boolean",
        default: "false",
        description: "Each field's description under its name.",
      },
      shared.className,
    ],
  },
  {
    slug: "relation-picker",
    name: "Relation picker",
    summary: "Links records of another table: search by name, id or hint; one or several.",
    imports: ["RelationPicker"],
    props: [
      { name: "label", type: "string", description: "Names the control and the search." },
      { name: "targets", type: "{ id, label, hint? }[]", description: "The records to link." },
      {
        name: "value / defaultValue",
        type: "string[]",
        description: "The linked ids. Controlled or not.",
      },
      { name: "onChange", type: "(ids: string[]) => void", description: "When a link changes." },
      {
        name: "multiple",
        type: "boolean",
        default: "false",
        description: "Several records; the list stays open while they are ticked.",
      },
      {
        name: "variant",
        type: `"field" | "chip"`,
        default: `"field"`,
        description: "A form control, or a chip in a row.",
      },
      {
        name: "open / onOpenChange",
        type: "boolean",
        description: "Opens the list from outside: a grid cell, a shortcut.",
      },
      shared.className,
    ],
  },
  {
    slug: "column-mapping",
    name: "Column mapping",
    summary: "Each column of a file, a sample of it, and the field it fills, or Skip.",
    imports: ["ColumnMapping", "guessMapping", "mappingProblems"],
    props: [
      {
        name: "columns",
        type: "{ name, samples? }[]",
        description: "The columns of the file, a few values each.",
      },
      shared.fields,
      {
        name: "value / defaultValue",
        type: "(fieldId | null)[]",
        description: "Per column, the field it fills. Guessed from the names by default.",
      },
      { name: "onChange", type: "(mapping) => void", description: "When a column changes field." },
      {
        name: "showProblems",
        type: "boolean",
        default: "true",
        description: "Required fields left without a column, a field filled twice.",
      },
      shared.className,
    ],
  },
  {
    slug: "import-wizard",
    name: "Import wizard",
    summary: "A CSV into a table: the file, the columns, every row checked, the import.",
    imports: ["ImportWizard"],
    props: [
      shared.fields,
      {
        name: "onImport",
        type: "(records) => ImportResult | void | Promise<…>",
        description:
          "Writes the valid records, keyed by field id. Return { inserted, failed?, message? }; a throw is shown.",
      },
      shared.relations,
      { name: "tableName", type: "string", description: "The table written to, in the result." },
      { name: "onClose", type: "() => void", description: "Cancel, and Done at the end." },
      {
        name: "previewRows",
        type: "number",
        default: "8",
        description: "Rows shown in the check step.",
      },
      { name: "defaultText", type: "string", description: "Pasted text to start from." },
      shared.className,
    ],
  },
  {
    slug: "table-list",
    name: "Table list",
    summary: "The tables of a database in sections, searchable, the open one marked.",
    imports: ["TableList"],
    props: [
      {
        name: "sections",
        type: "{ key, heading, items, onAdd?, addLabel? }[]",
        description: "An item: { id, name, icon?, trailing?, count?, href? }.",
      },
      { name: "current", type: "string | null", description: "The open table, marked." },
      { name: "onSelect", type: "(id) => void", description: "A click or Enter on a row." },
      {
        name: "searchable",
        type: "boolean",
        default: "true",
        description: "A search box; ↓ goes to the rows, Escape clears it.",
      },
      {
        name: "showCounts",
        type: "boolean",
        default: "false",
        description: "Row counts at the end. Off: counters in a list are noise.",
      },
      {
        name: "header",
        type: "ReactNode",
        description: "Above the search: a database switcher.",
      },
      {
        name: "empty",
        type: "ReactNode",
        default: `"No table matches"`,
        description: "When the search leaves nothing.",
      },
      shared.className,
    ],
  },
];
