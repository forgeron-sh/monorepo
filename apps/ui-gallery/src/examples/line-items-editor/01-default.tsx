import { LineItemsEditor, TotalsSummary, type LineItem, type ProductOption } from "@forgeron/ui";
import { useState } from "react";

const products: ProductOption[] = [
  {
    id: "p1",
    label: "Design workshop",
    hint: "SVC-001",
    unitPrice: 85000,
    taxRate: 20,
    unit: "day",
  },
  { id: "p2", label: "Brand guidelines", hint: "SVC-014", unitPrice: 240000, taxRate: 20 },
  {
    id: "p3",
    label: "Printed booklet",
    hint: "PRD-203",
    unitPrice: 1250,
    taxRate: 5.5,
    unit: "pcs",
  },
];

export default function Default() {
  const [lines, setLines] = useState<LineItem[]>([
    {
      id: "a",
      description: "Design workshop",
      quantity: 2,
      unit: "day",
      unitPrice: 85000,
      taxRate: 20,
      discount: 0,
      productId: "p1",
    },
    {
      id: "b",
      description: "Printed booklet",
      quantity: 40,
      unit: "pcs",
      unitPrice: 1250,
      taxRate: 5.5,
      discount: 10,
      productId: "p3",
    },
  ]);
  return (
    <div style={{ display: "grid", gap: 16, width: 760, maxWidth: "100%" }}>
      <LineItemsEditor
        value={lines}
        onChange={setLines}
        currency="EUR"
        locale="en"
        products={products}
        taxRates={[0, 5.5, 10, 20]}
        defaultTaxRate={20}
      />
      <div style={{ justifySelf: "end" }}>
        <TotalsSummary lines={lines} currency="EUR" locale="en" />
      </div>
    </div>
  );
}
