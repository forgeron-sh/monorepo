import { TotalsSummary, type LineItem } from "@forgeron/ui";

const lines: LineItem[] = [
  { id: "a", description: "Coffee beans", quantity: 3, unitPrice: 1250, taxRate: 5.5 },
  { id: "b", description: "Grinder", quantity: 1, unitPrice: 8900, taxRate: 20 },
];

export default function TaxIncluded() {
  return (
    <div style={{ width: 320 }}>
      <TotalsSummary lines={lines} currency="EUR" locale="en" pricesIncludeTax taxMode="line" />
    </div>
  );
}
