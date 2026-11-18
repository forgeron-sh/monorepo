import { RecordGrid, type CellValue, type DataField, type DataRecord } from "@forgeron/ui";
import { useState } from "react";

const fields: DataField[] = [
  { id: "name", name: "name", type: "text", required: true },
  { id: "stock", name: "stock", type: "number", decimals: 0 },
  { id: "organic", name: "organic", type: "boolean" },
];

export default function Default() {
  const [records, setRecords] = useState<DataRecord[]>([
    { id: "1", values: { name: "Brie de Meaux", stock: 42, organic: true } },
    { id: "2", values: { name: "Comté 18 mois", stock: 7, organic: false } },
    { id: "3", values: { name: "Tomme de Savoie", stock: null, organic: true } },
  ]);
  const change = (id: string, field: string, value: CellValue) =>
    setRecords((all) =>
      all.map((r) => (r.id === id ? { ...r, values: { ...r.values, [field]: value } } : r)),
    );
  return (
    <div style={{ width: 380 }}>
      <RecordGrid
        label="products"
        fields={fields}
        records={records}
        onChange={change}
        widths={{ name: 168 }}
      />
    </div>
  );
}
