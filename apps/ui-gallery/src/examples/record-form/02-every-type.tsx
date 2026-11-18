// Each field type with its control; the primary key is read only when editing.
import { RecordForm, type DataField } from "@forgeron/ui";
import { useState } from "react";

const fields: DataField[] = [
  { id: "id", name: "id", type: "number", primary: true, decimals: 0 },
  { id: "title", name: "title", type: "text", required: true },
  { id: "notes", name: "notes", type: "longText" },
  { id: "amount", name: "amount", type: "number", decimals: 2 },
  { id: "paid", name: "paid", type: "boolean" },
  { id: "due", name: "due_date", type: "date" },
  { id: "sent", name: "sent_at", type: "datetime" },
  {
    id: "status",
    name: "status",
    type: "select",
    choices: [
      { value: "draft", label: "Draft", color: "var(--ink-dim)" },
      { value: "sent", label: "Sent", color: "var(--warning)" },
      { value: "paid", label: "Paid", color: "var(--success)" },
    ],
  },
  {
    id: "labels",
    name: "labels",
    type: "multiSelect",
    choices: [
      { value: "urgent", label: "Urgent", color: "var(--danger)" },
      { value: "export", label: "Export", color: "var(--accent)" },
    ],
  },
  { id: "company", name: "company_id", type: "relation", relation: { table: "companies" } },
  {
    id: "contacts",
    name: "contacts",
    type: "relation",
    relation: { table: "contacts", multiple: true },
  },
  { id: "files", name: "attachments", type: "file" },
  { id: "site", name: "website", type: "url" },
  { id: "meta", name: "metadata", type: "json" },
];

const relations = {
  companies: [
    { id: "c-104", label: "Fromagerie Roy", hint: "Lyon" },
    { id: "c-212", label: "Garnier Transports", hint: "Grenoble" },
  ],
  contacts: [
    { id: "p-1", label: "Camille Roy", hint: "CR" },
    { id: "p-2", label: "Hugo Bernard", hint: "HB" },
    { id: "p-3", label: "Léa Martin", hint: "LM" },
  ],
};

export default function EveryType() {
  const [last, setLast] = useState("Edit, then ⌘↵");
  return (
    <div style={{ width: "min(560px, 100%)", display: "grid", gap: 8 }}>
      <RecordForm
        mode="edit"
        fields={fields}
        relations={relations}
        defaultValue={{
          id: 1042,
          title: "Winter cheese boards",
          amount: 12480,
          paid: false,
          due: "2026-12-01",
          status: "sent",
          labels: ["export"],
          company: ["c-104"],
          contacts: ["p-1", "p-3"],
          files: ["quote-1042.pdf"],
          site: "https://roy.example",
          meta: '{ "source": "crm" }',
        }}
        onCancel={() => setLast("Cancelled")}
        onSubmit={(values) => setLast(`Saved ${String(values.title)}`)}
      />
      <span style={{ font: "400 12px/16px var(--font-mono)", color: "var(--ink-muted)" }}>
        {last}
      </span>
    </div>
  );
}
