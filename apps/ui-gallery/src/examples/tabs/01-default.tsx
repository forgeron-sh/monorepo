import { Tabs } from "@forgeron/ui";
import { useState } from "react";

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "activity", label: "Activity" },
  { id: "settings", label: "Settings" },
];

export default function Default() {
  const [tab, setTab] = useState("overview");
  return (
    <div style={{ width: "100%", maxWidth: 520 }}>
      <Tabs label="Tool" tabs={tabs} value={tab} onChange={setTab}>
        {tabs.find((t) => t.id === tab)?.label} of the tool.
      </Tabs>
    </div>
  );
}
