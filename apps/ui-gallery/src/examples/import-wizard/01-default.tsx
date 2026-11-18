// A CSV into a table: drop a file or paste rows, match the columns, check every row, import.
import { ImportWizard, type DataField } from "@forgeron/ui";
import { useState } from "react";

const fields: DataField[] = [
  { id: "id", name: "id", type: "number", primary: true, decimals: 0 },
  { id: "name", name: "name", type: "text", required: true },
  { id: "price", name: "price", type: "number", decimals: 2 },
  { id: "organic", name: "organic", type: "boolean" },
  {
    id: "family",
    name: "family",
    type: "select",
    choices: [
      { value: "soft", label: "Soft" },
      { value: "hard", label: "Hard" },
      { value: "blue", label: "Blue" },
    ],
  },
];

const sample = `Name;Price;Organic;Family
Brie de Meaux;12,50;yes;Soft
Comté 18 mois;24,90;no;Hard
Roquefort;19,00;yes;Blue
Tomme de Savoie;abc;no;Hard
;8,40;no;Soft`;

export default function Default() {
  const [log, setLog] = useState("");
  return (
    <div style={{ width: "min(560px, 100%)", display: "grid", gap: 8 }}>
      <ImportWizard
        key={log}
        fields={fields}
        tableName="cheeses"
        defaultText={sample}
        onImport={async (records) => {
          await new Promise((r) => setTimeout(r, 400));
          return { inserted: records.length };
        }}
        onClose={() => setLog(String(Date.now()))}
      />
    </div>
  );
}
