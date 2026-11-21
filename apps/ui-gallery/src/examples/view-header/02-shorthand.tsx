import { PlusSignIcon } from "@forgeron/icons";
import { IconButton, ViewHeader } from "@forgeron/ui";
import { useState } from "react";

export default function Default() {
  const [tab, setTab] = useState("active");
  return (
    <div style={{ width: 320, border: "1px solid var(--line)" }}>
      <ViewHeader
        title="Issues"
        tabs={[
          { value: "all", label: "All issues" },
          { value: "active", label: "Active", count: 12 },
          { value: "backlog", label: "Backlog" },
        ]}
        tab={tab}
        onTabChange={setTab}
        action={<IconButton icon={PlusSignIcon} label="New issue" variant="boxed" size="sm" />}
      />
    </div>
  );
}
