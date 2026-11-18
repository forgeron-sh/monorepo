import { RecordGrid, type DataField } from "@forgeron/ui";

const fields: DataField[] = [
  { id: "id", name: "id", type: "text", primary: true },
  { id: "partner", name: "partner_id", type: "number", decimals: 0 },
  { id: "total", name: "amount_total", type: "number", decimals: 2 },
  { id: "state", name: "state", type: "text" },
  { id: "synced", name: "synced_at", type: "datetime" },
];

export default function ReadOnly() {
  return (
    <div style={{ width: "100%" }}>
      <RecordGrid
        label="odoo.account_move"
        fields={fields}
        showNull
        records={[
          {
            id: "INV/2026/0412",
            values: {
              id: "INV/2026/0412",
              partner: 1042,
              total: 1840,
              state: "posted",
              synced: "2026-11-18 09:15",
            },
          },
          {
            id: "INV/2026/0413",
            values: {
              id: "INV/2026/0413",
              partner: 2210,
              total: 312.4,
              state: "draft",
              synced: null,
            },
          },
        ]}
      />
    </div>
  );
}
