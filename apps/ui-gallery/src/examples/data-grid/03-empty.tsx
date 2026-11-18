import { DataGrid } from "@forgeron/ui";

export default function Empty() {
  return (
    <div style={{ width: "100%", maxWidth: 520 }}>
      <DataGrid
        label="refunds"
        columns={[
          { name: "id", type: "integer", chips: [{ kind: "primary" }], numeric: true },
          { name: "invoice_id", type: "integer", chips: [{ kind: "foreignKey" }] },
          { name: "reason", type: "text" },
        ]}
        rows={[]}
        empty="No refund matches these filters"
      />
    </div>
  );
}
