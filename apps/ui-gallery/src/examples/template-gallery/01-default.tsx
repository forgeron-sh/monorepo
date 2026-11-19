import { TemplateGallery, type TemplateItem } from "@forgeron/ui";
import { useState } from "react";

const lines = (rows: number[]) => (
  <div style={{ display: "grid", gap: 6, width: "70%" }}>
    {rows.map((w, i) => (
      <i
        key={i}
        style={{
          display: "block",
          height: i === 0 ? 8 : 5,
          width: `${w}%`,
          background: i === 0 ? "var(--ink)" : "var(--line-strong)",
        }}
      />
    ))}
  </div>
);

const both = (rows: number[]) => ({ thumbnail: lines(rows), preview: lines(rows) });

const templates: TemplateItem[] = [
  {
    id: "meeting",
    name: "Meeting notes",
    category: "Team",
    description: "Agenda, decisions and who does what by when.",
    keywords: ["agenda", "minutes"],
    ...both([40, 100, 90, 100, 60, 100, 80]),
  },
  {
    id: "retro",
    name: "Retrospective",
    category: "Team",
    description: "What went well, what did not, what we try next.",
    badge: "New",
    ...both([50, 100, 70, 100, 90]),
  },
  {
    id: "roadmap",
    name: "Roadmap",
    category: "Product",
    description: "Quarter by quarter, with owners and open questions.",
    ...both([35, 90, 100, 80, 100, 60]),
  },
  {
    id: "spec",
    name: "Product spec",
    category: "Product",
    description: "Problem, goals, scope, design and rollout.",
    ...both([45, 100, 100, 70, 100, 100, 50]),
  },
  {
    id: "onboarding",
    name: "Onboarding plan",
    category: "People",
    description: "A first week day by day, with people to meet.",
    ...both([55, 100, 80, 100, 70]),
  },
];

export default function Default() {
  const [log, setLog] = useState("Pick one, press Enter or double click");
  return (
    <div style={{ display: "grid", gap: 8, width: "100%" }}>
      <TemplateGallery
        templates={templates}
        onChoose={(id) => setLog(id === null ? "Started from blank" : `Started from ${id}`)}
      />
      <span style={{ color: "var(--ink-dim)", font: "400 11px/16px var(--font-mono)" }}>{log}</span>
    </div>
  );
}
