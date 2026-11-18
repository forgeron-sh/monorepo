import { SchemaFields, type DataField } from "@forgeron/ui";

const fields: DataField[] = [
  { id: "id", name: "id", type: "number", primary: true },
  { id: "name", name: "name", type: "text", required: true, unique: true },
  { id: "company", name: "company_id", type: "relation", relation: { table: "companies" } },
  { id: "close", name: "close_date", type: "date" },
];

export default function Default() {
  return (
    <div style={{ width: 380 }}>
      <SchemaFields defaultFields={fields} onReorder={() => {}} />
    </div>
  );
}
