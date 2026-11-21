import { CalendarView } from "@forgeron/ui";

const records = [
  { id: "OPS-40", title: "Supplier invoices", due: "2026-11-12", color: "var(--danger)" },
  { id: "OPS-38", title: "Signage audit", due: "2026-11-18", color: "var(--warning)" },
  { id: "OPS-37", title: "Carrier rates", due: "2026-11-18", color: "var(--accent)" },
  { id: "OPS-41", title: "Dock schedule", due: "2026-11-20" },
  { id: "OPS-35", title: "Safety walk", due: "2026-11-26", color: "var(--warning)" },
  { id: "OPS-30", title: "Archive notes", due: "2026-11-03", color: "var(--success)" },
];

export default function Month() {
  return (
    <div style={{ width: "100%", maxWidth: 720, border: "1px solid var(--line)" }}>
      <CalendarView records={records} today="2026-11-18" modes={["month"]} />
    </div>
  );
}
