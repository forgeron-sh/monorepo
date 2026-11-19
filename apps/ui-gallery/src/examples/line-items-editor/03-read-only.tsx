import { LineItemsEditor, type LineItem } from "@forgeron/ui";

const lines: LineItem[] = [
  { id: "s1", kind: "section", description: "Services" },
  { id: "a", description: "Monthly hosting", quantity: 12, unitPrice: 4900, taxRate: 20 },
  {
    id: "b",
    description: "Support hours",
    quantity: 6.5,
    unit: "h",
    unitPrice: 9000,
    taxRate: 20,
    discount: 10,
  },
];

export default function ReadOnly() {
  return (
    <div style={{ width: 640, maxWidth: "100%" }}>
      <LineItemsEditor value={lines} currency="EUR" locale="en" readOnly />
    </div>
  );
}
