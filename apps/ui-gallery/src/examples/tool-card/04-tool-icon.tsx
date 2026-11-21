import { ToolIcon } from "@forgeron/ui";

// A tool has no logo here: its first letters, black and white, sharp corners.
export default function ToolIcons() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <ToolIcon name="Invoices sync" />
      <ToolIcon name="CRM import" />
      <ToolIcon name="Carrier rates" size="lg" />
    </div>
  );
}
