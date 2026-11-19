import { LineItemsEditor, type LineItem } from "@forgeron/ui";

const lines: LineItem[] = [
  { id: "s1", kind: "section", description: "Discovery" },
  { id: "a", description: "Interviews", quantity: 3, unitPrice: 60000, taxRate: 20 },
  { id: "b", description: "Synthesis report", quantity: 1, unitPrice: 90000, taxRate: 20 },
  { id: "s2", kind: "section", description: "Delivery" },
  {
    id: "c",
    description: "Prototype",
    quantity: 5,
    unit: "day",
    unitPrice: 70000,
    taxRate: 20,
    discount: 5,
  },
];

export default function Sections() {
  return (
    <div style={{ width: 720, maxWidth: "100%" }}>
      <LineItemsEditor defaultValue={lines} currency="EUR" locale="en" showDiscount={false} />
    </div>
  );
}
