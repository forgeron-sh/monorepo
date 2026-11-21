import { VersionCompare, type CompareVersion } from "@forgeron/ui";
import { useState } from "react";

const page = (n: number) =>
  [
    "# Launch plan",
    "",
    n >= 2 ? "Goal: 500 sign-ups in the first month." : "Goal: 300 sign-ups.",
    "Owner: Léa Martin",
    n >= 3 ? "Budget: 12 000 EUR, reviewed weekly." : "Budget: 10 000 EUR.",
    "",
    "## Steps",
    "1. Announce on the blog",
    "2. Email the waiting list",
    n >= 3 ? "3. Open the community" : null,
    n >= 4 ? "4. Press briefing" : null,
  ]
    .filter((l): l is string => l !== null)
    .join("\n");

const versions: CompareVersion[] = [
  { id: "v4", label: "v4", at: "Nov 18, 15:40", by: "Camille Roy", content: page(4) },
  {
    id: "v3",
    label: "v3",
    at: "Nov 14, 09:12",
    by: "Léa Martin",
    note: "Budget raised",
    content: page(3),
  },
  {
    id: "v2",
    label: "v2",
    at: "Nov 9, 17:30",
    by: "Hugo Bernard",
    note: "Bigger goal",
    content: page(2),
  },
  { id: "v1", label: "v1", at: "Nov 2, 11:05", by: "Léa Martin", content: page(1) },
];

export default function Text() {
  const [log, setLog] = useState("");
  return (
    <div style={{ display: "grid", gap: 8, width: "100%" }}>
      <VersionCompare versions={versions} onRestore={(id) => setLog(`Restore ${id}`)} />
      {log ? (
        <span style={{ color: "var(--ink-dim)", font: "400 11px/16px var(--font-mono)" }}>
          {log}
        </span>
      ) : null}
    </div>
  );
}
