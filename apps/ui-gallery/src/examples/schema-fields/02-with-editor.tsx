// The fields of a table and the editor of the open one, side by side: drag a handle or press
// Alt + arrows to reorder, click a field to edit it, ⋯ for its actions.
import { FieldEditor, SchemaFields, type DataField } from "@forgeron/ui";
import { useState } from "react";

const seed: DataField[] = [
  { id: "id", name: "id", type: "number", primary: true, decimals: 0 },
  { id: "name", name: "name", type: "text", required: true, description: "As on the invoice." },
  { id: "email", name: "email", type: "email", unique: true },
  {
    id: "segment",
    name: "segment",
    type: "select",
    choices: [
      { value: "smb", label: "SMB", color: "var(--ink-dim)" },
      { value: "mid", label: "Mid-market", color: "var(--accent)" },
    ],
  },
  { id: "owner", name: "owner_id", type: "relation", relation: { table: "people" } },
  { id: "created", name: "created_at", type: "datetime", readOnly: true },
];

const tables = [
  { value: "people", label: "People" },
  { value: "companies", label: "Companies" },
];

export default function WithEditor() {
  const [fields, setFields] = useState(seed);
  const [open, setOpen] = useState<string | null>("segment");
  const field = fields.find((f) => f.id === open);
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: 16,
        width: "100%",
        alignItems: "start",
      }}
    >
      <SchemaFields
        fields={fields}
        onReorder={setFields}
        onOpen={setOpen}
        selected={open}
        showDescriptions
        onAdd={() => {
          const id = `field_${fields.length + 1}`;
          setFields([...fields, { id, name: id, type: "text" }]);
          setOpen(id);
        }}
        fieldMenu={(f) =>
          f.primary
            ? []
            : [
                { id: "edit", label: "Edit" },
                { separator: true },
                { id: "delete", label: "Delete field", danger: true },
              ]
        }
        onFieldAction={(id, action) => {
          if (action === "edit") setOpen(id);
          if (action === "delete") setFields(fields.filter((f) => f.id !== id));
        }}
      />
      {field ? (
        <FieldEditor
          key={field.id}
          defaultValue={field}
          tables={tables}
          takenNames={fields.filter((f) => f.id !== field.id).map((f) => f.name)}
          onSubmit={(next) => {
            setFields(fields.map((f) => (f.id === next.id ? next : f)));
            setOpen(null);
          }}
          onCancel={() => setOpen(null)}
        />
      ) : null}
    </div>
  );
}
