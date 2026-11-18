// A table editor: every field type, rows to select and open, a + to add a record or a field, the
// headers sort. Click a cell, then use the keyboard: arrows, Enter or F2, type to replace, Escape,
// Tab, Delete, Space on a checkbox, Shift+Enter opens the record.
import {
  Drawer,
  RecordForm,
  RecordGrid,
  type CellValue,
  type DataField,
  type DataRecord,
  type RecordGridSort,
} from "@forgeron/ui";
import { useState } from "react";

const fields: DataField[] = [
  { id: "id", name: "id", type: "number", primary: true, decimals: 0 },
  { id: "name", name: "name", type: "text", required: true },
  {
    id: "stage",
    name: "stage",
    type: "select",
    choices: [
      { value: "lead", label: "Lead", color: "var(--ink-dim)" },
      { value: "quote", label: "Quote", color: "var(--warning)" },
      { value: "won", label: "Won", color: "var(--success)" },
      { value: "lost", label: "Lost", color: "var(--danger)" },
    ],
  },
  { id: "amount", name: "amount", type: "number", decimals: 2 },
  { id: "company", name: "company_id", type: "relation", relation: { table: "companies" } },
  { id: "close", name: "close_date", type: "date" },
  { id: "signed", name: "signed", type: "boolean" },
  {
    id: "tags",
    name: "tags",
    type: "multiSelect",
    choices: [
      { value: "b2b", label: "B2B", color: "var(--accent)" },
      { value: "export", label: "Export", color: "var(--success)" },
      { value: "retail", label: "Retail", color: "var(--ink-dim)" },
    ],
  },
  { id: "contact", name: "contact_email", type: "email" },
  { id: "files", name: "attachments", type: "file" },
];

const relations = {
  companies: [
    { id: "c-104", label: "Fromagerie Roy", hint: "Lyon" },
    { id: "c-212", label: "Garnier Transports", hint: "Grenoble" },
    { id: "c-318", label: "Petit & Fils", hint: "Annecy" },
    { id: "c-402", label: "Martin Distribution", hint: "Chambéry" },
  ],
};

const seed: DataRecord[] = [
  {
    id: "1",
    values: {
      id: 1,
      name: "Winter cheese boards",
      stage: "won",
      amount: 12480,
      company: ["c-104"],
      close: "2026-11-04",
      signed: true,
      tags: ["b2b", "retail"],
      contact: "camille@roy.fr",
      files: ["quote-1042.pdf"],
    },
  },
  {
    id: "2",
    values: {
      id: 2,
      name: "Refrigerated transport, Q1",
      stage: "quote",
      amount: 8900.5,
      company: ["c-212"],
      close: "2026-12-15",
      signed: false,
      tags: ["b2b"],
      contact: "hugo@garnier.fr",
      files: null,
    },
  },
  {
    id: "3",
    values: {
      id: 3,
      name: "Export to Geneva",
      stage: "lead",
      amount: null,
      company: ["c-318"],
      close: null,
      signed: false,
      tags: ["export"],
      contact: null,
      files: null,
    },
  },
  {
    id: "4",
    values: {
      id: 4,
      name: "Supermarket shelf space",
      stage: "lost",
      amount: 3200,
      company: ["c-402"],
      close: "2026-10-01",
      signed: false,
      tags: ["retail"],
      contact: "lea@martin.fr",
      files: null,
    },
  },
];

const compare = (a: CellValue, b: CellValue) => {
  if (a === b) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return String(a).localeCompare(String(b), "en", { numeric: true });
};

export default function Spreadsheet() {
  const [records, setRecords] = useState(seed);
  const [selection, setSelection] = useState<string[]>([]);
  const [sort, setSort] = useState<RecordGridSort | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const change = (id: string, field: string, value: CellValue) =>
    setRecords((all) =>
      all.map((r) => (r.id === id ? { ...r, values: { ...r.values, [field]: value } } : r)),
    );
  const shown = sort
    ? [...records].sort(
        (a, b) =>
          compare(a.values[sort.field] ?? null, b.values[sort.field] ?? null) *
          (sort.direction === "asc" ? 1 : -1),
      )
    : records;
  const add = () => {
    const id = String(Math.max(...records.map((r) => Number(r.id))) + 1);
    setRecords([...records, { id, values: { id: Number(id), name: "New deal" } }]);
  };
  const record = records.find((r) => r.id === open);
  return (
    <div style={{ display: "flex", gap: 12, width: "100%", alignItems: "flex-start" }}>
      <div style={{ flex: 1, minWidth: 0, display: "grid", gap: 8 }}>
        <span style={{ font: "400 12px/16px var(--font-mono)", color: "var(--ink-muted)" }}>
          {selection.length ? `${selection.length} selected` : `${records.length} records`}
        </span>
        <RecordGrid
          label="deals"
          fields={fields}
          records={shown}
          relations={relations}
          onChange={change}
          selectable
          selection={selection}
          onSelectionChange={setSelection}
          onOpenRecord={setOpen}
          onAddRecord={add}
          onAddField={() => {}}
          sort={sort}
          onSortChange={setSort}
          fieldMenu={(f) => [
            { id: "edit", label: `Edit ${f.name}` },
            { id: "hide", label: "Hide the field" },
          ]}
        />
      </div>
      {record ? (
        <Drawer
          title={`deals.${record.id}`}
          description="Saved when you press Save."
          onClose={() => setOpen(null)}
        >
          <RecordForm
            key={record.id}
            mode="edit"
            fields={fields}
            defaultValue={record.values}
            relations={relations}
            onCancel={() => setOpen(null)}
            onSubmit={(values) => {
              setRecords((all) => all.map((r) => (r.id === record.id ? { ...r, values } : r)));
              setOpen(null);
            }}
          />
        </Drawer>
      ) : null}
    </div>
  );
}
