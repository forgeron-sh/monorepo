// The choices of a select: Enter adds the next one, Backspace in an empty one removes it, the
// square cycles its colour.
import { FieldEditor, type DataField } from "@forgeron/ui";
import { useState } from "react";

export default function SelectChoices() {
  const [field, setField] = useState<DataField>({
    id: "stage",
    name: "stage",
    type: "select",
    description: "Where the deal stands.",
    choices: [
      { value: "lead", label: "Lead", color: "var(--ink-dim)" },
      { value: "quote", label: "Quote", color: "var(--warning)" },
      { value: "won", label: "Won", color: "var(--success)" },
    ],
    defaultValue: "lead",
  });
  return (
    <div style={{ width: 400 }}>
      <FieldEditor
        value={field}
        onChange={setField}
        takenNames={["id", "name", "amount"]}
        onSubmit={setField}
        onCancel={() => {}}
        onDelete={() => {}}
      />
    </div>
  );
}
