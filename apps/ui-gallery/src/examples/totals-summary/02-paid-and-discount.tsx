import { TotalsSummary, computeTotals, type LineItem } from "@forgeron/ui";

const lines: LineItem[] = [
  { id: "a", description: "Workshop", quantity: 2, unitPrice: 85000, taxRate: 20, discount: 5 },
  { id: "b", description: "Booklets", quantity: 40, unitPrice: 1250, taxRate: 5.5 },
];

export default function PaidAndDiscount() {
  const totals = computeTotals(lines, { discount: { percent: 10 }, paid: 50000 });
  return (
    <div style={{ width: 340 }}>
      <TotalsSummary totals={totals} currency="EUR" locale="en" footer="Due on 1 December 2026." />
    </div>
  );
}
