import { FieldEditor } from "@forgeron/ui";
import { useState } from "react";

export default function Default() {
  const [saved, setSaved] = useState("");
  return (
    <div style={{ width: 380, display: "grid", gap: 8 }}>
      <FieldEditor
        defaultValue={{ id: "f1", name: "due_date", type: "date", required: true }}
        takenNames={["id", "name"]}
        onSubmit={(field) => setSaved(`${field.name}: ${field.type}`)}
      />
      {saved ? <code style={{ font: "400 11px/16px var(--font-mono)" }}>{saved}</code> : null}
    </div>
  );
}
