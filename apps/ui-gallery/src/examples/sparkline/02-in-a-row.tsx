import { Sparkline } from "@forgeron/ui";

const tools = [
  { name: "invoices-sync", runs: "1,204", trend: [80, 92, 88, 101, 97, 110, 118, 121, 130] },
  { name: "crm-import", runs: "318", trend: [40, 38, 41, 36, 35, 33, 34, 31, 30] },
  { name: "carrier-rates", runs: "57", trend: [6, 7, 6, 6, 7, 6, 7, 6, 7] },
];

// In a dense row the trend is grey: the figure stays the thing to read.
export default function InARow() {
  return (
    <ul style={{ width: 360, margin: 0, padding: 0, listStyle: "none" }}>
      {tools.map((tool) => (
        <li
          key={tool.name}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto 64px",
            alignItems: "center",
            gap: 12,
            height: 36,
            borderBottom: "1px solid var(--line)",
            font: "400 13px/18px var(--font-mono)",
          }}
        >
          <span>{tool.name}</span>
          <span style={{ color: "var(--ink-muted)" }}>{tool.runs}</span>
          <Sparkline values={tool.trend} width={64} height={16} tone="ink" />
        </li>
      ))}
    </ul>
  );
}
