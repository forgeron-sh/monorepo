import { Table } from "@forgeron/ui";

type Invoice = { id: string; customer: string; amount: string };

const rows: Invoice[] = [
  { id: "INV-2041", customer: "Maison Roy", amount: "€1,240.00" },
  { id: "INV-2040", customer: "Bernard & fils", amount: "€86.50" },
  { id: "INV-2039", customer: "Atelier Martin", amount: "€3,912.00" },
];

export default function Default() {
  return (
    <div style={{ width: 380 }}>
      <Table<Invoice>
        label="Invoices"
        rowKey={(r) => r.id}
        rows={rows}
        columns={[
          { key: "id", header: "Number", mono: true },
          { key: "customer", header: "Customer" },
          { key: "amount", header: "Amount", align: "end", mono: true },
        ]}
      />
    </div>
  );
}
