import { TotalsSummary, type LineItem } from "@forgeron/ui";

const lines: LineItem[] = [
  { id: "a", description: "Workshop", quantity: 2, unitPrice: 85000, taxRate: 20 },
  { id: "b", description: "Booklets", quantity: 40, unitPrice: 1250, taxRate: 5.5 },
];

export default function Default() {
  return (
    <div style={{ width: 320 }}>
      <TotalsSummary lines={lines} currency="EUR" locale="en" />
    </div>
  );
}
