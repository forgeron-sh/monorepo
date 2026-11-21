import { Delete02Icon, GitForkIcon, Invoice01Icon } from "@forgeron/icons";
import { IconButton, StepCard } from "@forgeron/ui";
import { useState } from "react";

// layout="node": 240px wide, the state on the top edge. The body of a node of @forgeron/flow:
// the canvas draws the ports and the wires around it.
export default function AsACanvasNode() {
  const [selected, setSelected] = useState("if");
  return (
    <div style={{ display: "flex", gap: 32, flexWrap: "wrap", paddingTop: 12 }}>
      <StepCard
        layout="node"
        kind="logic"
        icon={GitForkIcon}
        title="Above €5,000?"
        subtitle="Flows · ifElse()"
        status="running"
        selected={selected === "if"}
        onSelect={() => setSelected("if")}
      />
      <StepCard
        layout="node"
        icon={Invoice01Icon}
        title="Draft the invoice"
        subtitle="Invoices · createDraft()"
        status="reused"
        meta="Reused from #1203 · 1 item"
        selected={selected === "inv"}
        onSelect={() => setSelected("inv")}
        actions={<IconButton icon={Delete02Icon} label="Delete" size="sm" />}
      />
    </div>
  );
}
