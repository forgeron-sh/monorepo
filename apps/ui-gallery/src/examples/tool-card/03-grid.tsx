import { Badge, Button, ToolCard } from "@forgeron/ui";
import { useState } from "react";

const tools = [
  {
    name: "Invoices sync",
    summary: "Brings supplier invoices from Odoo into the ledger every hour.",
    version: "1.4.0",
    state: "live",
  },
  {
    name: "CRM import",
    summary: "Imports leads from a spreadsheet and matches them to existing contacts.",
    version: "0.9.2",
    state: "connect",
  },
  {
    name: "Carrier rates",
    summary: "Compares carrier prices for a parcel and books the cheapest pickup.",
    version: "2.1.0",
    state: "update",
  },
] as const;

// The whole card links to the tool; the footer button stays its own target.
export default function Grid() {
  const [opened, setOpened] = useState<string | null>(null);
  return (
    <div style={{ display: "grid", gap: 12, width: "100%" }}>
      <ul
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 12,
          margin: 0,
          padding: 0,
        }}
      >
        {tools.map((tool) => (
          <ToolCard
            key={tool.name}
            name={tool.name}
            summary={tool.summary}
            href={`#/tools/${tool.name}`}
            onNavigate={() => setOpened(tool.name)}
            meta={
              <>
                <Badge mono>{tool.version}</Badge>
                {tool.state === "update" ? <Badge tone="warning">Update</Badge> : null}
              </>
            }
            footer={
              tool.state === "connect" ? (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => setOpened(`Connect ${tool.name}`)}
                >
                  Connect
                </Button>
              ) : (
                <Button size="sm" onClick={() => setOpened(`Open ${tool.name}`)}>
                  Open
                </Button>
              )
            }
          />
        ))}
      </ul>
      {opened ? <p style={{ margin: 0, color: "var(--ink-muted)" }}>Clicked: {opened}</p> : null}
    </div>
  );
}
