import { RecordForm, type DataField } from "@forgeron/ui";
import { useState } from "react";

const fields: DataField[] = [
  { id: "name", name: "name", type: "text", required: true },
  { id: "email", name: "email", type: "email", description: "Where invoices are sent." },
  {
    id: "plan",
    name: "plan",
    type: "select",
    required: true,
    choices: [
      { value: "free", label: "Free", color: "var(--ink-dim)" },
      { value: "team", label: "Team", color: "var(--accent)" },
    ],
  },
];

export default function NewRecord() {
  const [saved, setSaved] = useState("");
  return (
    <div style={{ width: 380, display: "grid", gap: 8 }}>
      <RecordForm fields={fields} onSubmit={(values) => setSaved(JSON.stringify(values))} />
      {saved ? (
        <code style={{ font: "400 11px/16px var(--font-mono)", color: "var(--ink-muted)" }}>
          {saved}
        </code>
      ) : null}
    </div>
  );
}
