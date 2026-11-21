import { Table } from "@forgeron/ui";

export default function Empty() {
  return (
    <div style={{ width: "100%", maxWidth: 480 }}>
      <Table<{ id: string }>
        label="Payments"
        rowKey={(r) => r.id}
        rows={[]}
        empty="No payment this month"
        columns={[
          { key: "date", header: "Date" },
          { key: "payer", header: "Payer" },
          { key: "amount", header: "Amount", align: "end" },
        ]}
      />
    </div>
  );
}
