import { Avatar, IssueList } from "@forgeron/ui";
import { useState } from "react";

const people = [
  { id: "cr", name: "Camille Roy" },
  { id: "hb", name: "Hugo Bernard" },
];

export default function ByAssignee() {
  const [selected, setSelected] = useState<string | null>("OPS-36");
  return (
    <div style={{ width: "100%", display: "grid", gap: 12 }}>
      <IssueList
        people={people}
        properties={["priority", "id", "status", "due"]}
        today="2026-11-17"
        selected={selected}
        onSelectedChange={setSelected}
        groups={[
          {
            key: "cr",
            name: "Camille Roy (you)",
            glyph: <Avatar name="Camille Roy" size={16} />,
            issues: [
              {
                id: "OPS-36",
                title: "Carrier rates: import the new grid",
                status: "progress",
                priority: 2,
                due: "2026-11-20",
              },
              {
                id: "OPS-22",
                title: "Renew the forklift inspection",
                status: "todo",
                priority: 1,
                due: "2026-11-16",
              },
            ],
          },
          {
            key: "hb",
            name: "Hugo Bernard",
            glyph: <Avatar name="Hugo Bernard" size={16} />,
            issues: [
              {
                id: "OPS-40",
                title: "Supplier invoices arrive twice from Odoo",
                status: "review",
                priority: 1,
              },
            ],
          },
        ]}
      />
      <span style={{ font: "400 11px/1 var(--font-mono)", color: "var(--ink-dim)" }}>
        CURRENT: {selected ?? "NONE"} · ↑ ↓ TO MOVE
      </span>
    </div>
  );
}
