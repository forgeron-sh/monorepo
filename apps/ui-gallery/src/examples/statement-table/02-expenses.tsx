import { StatementTable, type StatementEntry } from "@forgeron/ui";

const entries: StatementEntry[] = [
  { id: "1", date: "2026-11-02", description: "Train, Lyon to Paris", amount: -8900 },
  {
    id: "2",
    date: "2026-11-02",
    description: "Lunch with a client",
    reference: "R-12",
    amount: -3240,
  },
  { id: "3", date: "2026-11-05", description: "Cash advance returned", amount: 5000 },
];

export default function Expenses() {
  return (
    <div style={{ width: 640, maxWidth: "100%" }}>
      <StatementTable
        entries={entries}
        currency="EUR"
        locale="en"
        invert
        sort="date"
        showReference={false}
        totalLabel="Net spent"
      />
    </div>
  );
}
