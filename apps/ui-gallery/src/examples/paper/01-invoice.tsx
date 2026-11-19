import {
  Button,
  DocumentHeader,
  LineItemsEditor,
  MetaTable,
  Paper,
  PartyBlock,
  StatusBadge,
  TotalsSummary,
  printPaper,
  type LineItem,
} from "@forgeron/ui";
import { useRef } from "react";

const lines: LineItem[] = [
  {
    id: "a",
    description: "Design workshop",
    quantity: 2,
    unit: "day",
    unitPrice: 85000,
    taxRate: 20,
  },
  {
    id: "b",
    description: "Printed booklet",
    quantity: 40,
    unit: "pcs",
    unitPrice: 1250,
    taxRate: 5.5,
    discount: 10,
  },
];

export default function Invoice() {
  const sheet = useRef<HTMLDivElement>(null);
  return (
    <div style={{ display: "grid", gap: 12, width: "100%" }}>
      <div>
        <Button
          size="sm"
          onClick={() => {
            const el = sheet.current?.querySelector<HTMLElement>(".fg-paper");
            if (el) printPaper(el, "Invoice INV-2026-0042");
          }}
        >
          Print
        </Button>
      </div>
      <div ref={sheet}>
        <Paper
          label="Invoice INV-2026-0042"
          footer="Atelier Exemple · 1 Test Street · Payment within 30 days"
        >
          <DocumentHeader
            title="Invoice"
            number="INV-2026-0042"
            brand={<strong>Atelier Exemple</strong>}
            status={<StatusBadge status="sent" />}
          />
          <div className="fg-paper-parties">
            <PartyBlock
              label="From"
              name="Atelier Exemple"
              lines={["1 Test Street", "00000 Sampletown"]}
            />
            <PartyBlock
              label="Bill to"
              name="Client Exemple"
              lines={["2 Sample Avenue", "00000 Sampletown"]}
            />
          </div>
          <MetaTable
            rows={[
              { label: "Issued", value: "2026-11-19" },
              { label: "Due", value: "2026-12-19" },
            ]}
          />
          <LineItemsEditor value={lines} currency="EUR" locale="en" readOnly />
          <div style={{ alignSelf: "flex-end", width: 280 }}>
            <TotalsSummary lines={lines} currency="EUR" locale="en" paid={20000} />
          </div>
        </Paper>
      </div>
    </div>
  );
}
