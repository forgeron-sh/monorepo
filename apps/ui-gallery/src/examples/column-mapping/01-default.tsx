// The columns of a file and the field each one fills, guessed from their names. A required
// field left without a column is said under the table.
import { ColumnMapping, type DataField } from "@forgeron/ui";

const fields: DataField[] = [
  { id: "name", name: "name", type: "text", required: true },
  { id: "email", name: "email", type: "email" },
  { id: "city", name: "city", type: "text" },
  { id: "since", name: "customer_since", type: "date" },
];

export default function Default() {
  return (
    <div style={{ width: "min(520px, 100%)" }}>
      <ColumnMapping
        fields={fields}
        columns={[
          { name: "Name", samples: ["Fromagerie Roy", "Garnier Transports"] },
          { name: "E-mail", samples: ["contact@roy.fr", "hugo@garnier.fr"] },
          { name: "Customer since", samples: ["2021-03-01", "2024-09-12"] },
          { name: "Internal code", samples: ["R-104", "G-212"] },
        ]}
      />
    </div>
  );
}
