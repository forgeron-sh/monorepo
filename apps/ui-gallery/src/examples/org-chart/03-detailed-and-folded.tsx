// The detailed card, with a team line and a badge; the COO's branch starts folded.
import { Badge, OrgChart, type OrgPerson } from "@forgeron/ui";
import { useState } from "react";

const team: OrgPerson[] = [
  {
    id: "ceo",
    name: "Camille Roy",
    title: "Chief executive",
    meta: "Paris",
    children: [
      {
        id: "cto",
        name: "Hugo Bernard",
        title: "CTO",
        meta: "Engineering",
        badge: <Badge tone="success">Hiring</Badge>,
        children: [
          { id: "be", name: "Léa Martin", title: "Backend lead", meta: "Engineering" },
          { id: "dev", name: "Backend", title: "Senior engineer", vacant: true },
        ],
      },
      {
        id: "coo",
        name: "Inès Garcia",
        title: "COO",
        meta: "Operations",
        children: [
          { id: "ops", name: "Sam Dupont", title: "Operations", meta: "Operations" },
          { id: "cs", name: "Zoé Faure", title: "Support", meta: "Operations" },
        ],
      },
    ],
  },
];

export default function DetailedAndFolded() {
  const [picked, setPicked] = useState<string | null>(null);
  return (
    <div style={{ display: "grid", gap: 8, width: "100%" }}>
      <OrgChart
        roots={team}
        variant="detailed"
        defaultCollapsed={["coo"]}
        selected={picked}
        onSelectedChange={setPicked}
      />
      <span style={{ color: "var(--ink-dim)", font: "400 11px/16px var(--font-mono)" }}>
        {picked ? `Selected: ${picked}` : "Use the arrows, + and −"}
      </span>
    </div>
  );
}
