import { ReceiptViewer, type ReceiptField } from "@forgeron/ui";
import { useState } from "react";

// A made-up receipt, drawn as an SVG so the example carries no real document.
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600"><rect width="400" height="600" fill="#fff"/><g font-family="monospace" fill="#222"><text x="200" y="50" font-size="24" text-anchor="middle" font-weight="bold">CAFE EXEMPLE</text><text x="200" y="76" font-size="12" text-anchor="middle">1 Test Street</text><text x="40" y="130" font-size="14">2026-11-18  12:41</text><text x="40" y="190" font-size="14">Espresso x2</text><text x="360" y="190" font-size="14" text-anchor="end">5.00</text><text x="40" y="215" font-size="14">Croissant</text><text x="360" y="215" font-size="14" text-anchor="end">2.50</text><text x="40" y="270" font-size="14">VAT 10 %</text><text x="360" y="270" font-size="14" text-anchor="end">0.68</text><text x="40" y="330" font-size="20" font-weight="bold">TOTAL</text><text x="360" y="330" font-size="20" font-weight="bold" text-anchor="end">7.50</text></g></svg>`;
const src = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

const initial: ReceiptField[] = [
  {
    id: "merchant",
    label: "Merchant",
    value: "Cafe Exemple",
    confidence: 0.98,
    box: { x: 0.2, y: 0.05, w: 0.6, h: 0.06 },
  },
  {
    id: "date",
    label: "Date",
    value: "2026-11-18",
    confidence: 0.91,
    box: { x: 0.1, y: 0.19, w: 0.36, h: 0.04 },
  },
  {
    id: "vat",
    label: "VAT",
    value: "0.68",
    confidence: 0.62,
    box: { x: 0.8, y: 0.43, w: 0.12, h: 0.04 },
  },
  {
    id: "total",
    label: "Total",
    value: "7.50",
    confidence: 0.44,
    box: { x: 0.8, y: 0.53, w: 0.14, h: 0.05 },
  },
  { id: "category", label: "Category", value: "Meals" },
];

export default function Default() {
  const [fields, setFields] = useState(initial);
  return (
    <div style={{ width: 760, maxWidth: "100%" }}>
      <ReceiptViewer
        pages={[{ src, aspect: 400 / 600, alt: "Receipt from Cafe Exemple" }]}
        fields={fields}
        onFieldChange={(id, value) =>
          setFields((all) => all.map((f) => (f.id === id ? { ...f, value, verified: true } : f)))
        }
      />
    </div>
  );
}
