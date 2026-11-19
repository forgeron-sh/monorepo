import { StatementTable, type StatementEntry } from "@forgeron/ui";
import { useState } from "react";

const entries: StatementEntry[] = [
  {
    id: "1",
    date: "2026-10-03",
    description: "Invoice INV-0101",
    reference: "INV-0101",
    amount: 240000,
    group: "October",
  },
  {
    id: "2",
    date: "2026-10-14",
    description: "Payment received",
    reference: "PAY-77",
    amount: -150000,
    group: "October",
  },
  {
    id: "3",
    date: "2026-11-02",
    description: "Invoice INV-0108",
    reference: "INV-0108",
    amount: 98000,
    group: "November",
  },
  {
    id: "4",
    date: "2026-11-09",
    description: "Credit note",
    reference: "CN-0004",
    amount: -12000,
    group: "November",
  },
];

export default function Default() {
  const [last, setLast] = useState("");
  return (
    <div style={{ width: 760, maxWidth: "100%", display: "grid", gap: 8 }}>
      <StatementTable
        label="Customer account"
        entries={entries}
        currency="EUR"
        locale="en"
        opening={50000}
        onExport={({ csv }) => setLast(`${csv.split("\r\n").length} lines ready to save`)}
      />
      {last ? <p style={{ margin: 0, font: "12px var(--font-mono)" }}>{last}</p> : null}
    </div>
  );
}
