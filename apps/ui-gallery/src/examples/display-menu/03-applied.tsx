import { Calendar03Icon, Folder01Icon, Loading03Icon, UserIcon } from "@forgeron/icons";
import { DisplayMenu, type DisplayOptions } from "@forgeron/ui";
import { useState } from "react";

const initial: DisplayOptions = {
  layout: "board",
  grouping: "assignee",
  ordering: "due",
  toggles: { emptyGroups: true },
  properties: ["id", "due"],
};

export default function Applied() {
  const [display, setDisplay] = useState(initial);
  return (
    <div style={{ width: "100%", display: "grid", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <DisplayMenu
          value={display}
          onChange={setDisplay}
          groupings={[
            { value: "status", label: "Status", icon: Loading03Icon },
            { value: "assignee", label: "Assignee", icon: UserIcon },
            { value: "project", label: "Project", icon: Folder01Icon },
            { value: "none", label: "No grouping" },
          ]}
          orderings={[
            { value: "priority", label: "Priority" },
            { value: "due", label: "Due date", icon: Calendar03Icon },
            { value: "updated", label: "Updated" },
          ]}
          toggles={[{ id: "emptyGroups", label: "Show empty groups" }]}
          properties={[
            { id: "id", label: "ID" },
            { id: "status", label: "Status" },
            { id: "due", label: "Due date" },
            { id: "assignee", label: "Assignee" },
          ]}
        />
      </div>
      <pre
        style={{
          margin: 0,
          padding: 12,
          border: "1px solid var(--line)",
          color: "var(--ink-muted)",
          font: "400 12px/18px var(--font-mono)",
        }}
      >
        {JSON.stringify(display, null, 2)}
      </pre>
    </div>
  );
}
