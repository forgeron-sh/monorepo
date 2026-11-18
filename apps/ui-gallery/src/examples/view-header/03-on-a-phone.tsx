import { Folder01Icon, PlusSignIcon } from "@forgeron/icons";
import {
  DisplayMenu,
  FilterMenu,
  IconButton,
  ViewHeader,
  type DisplayOptions,
  type Filter,
  type FilterField,
} from "@forgeron/ui";
import { useState } from "react";

const fields: FilterField[] = [
  {
    id: "project",
    label: "Project",
    icon: Folder01Icon,
    options: ["Q4 closing", "Supplier portal", "Odoo bridge"].map((p) => ({ value: p, label: p })),
  },
];

export default function OnAPhone() {
  const [tab, setTab] = useState("all");
  const [filters, setFilters] = useState<Filter[]>([]);
  const [display, setDisplay] = useState<DisplayOptions>({
    layout: "list",
    grouping: "status",
    ordering: "priority",
    toggles: {},
    properties: ["id", "status"],
  });
  return (
    <div style={{ width: 360, border: "1px solid var(--line)" }}>
      <ViewHeader
        title="My issues"
        tabs={[
          { value: "all", label: "Assigned", count: 14 },
          { value: "created", label: "Created" },
          { value: "subscribed", label: "Subscribed" },
          { value: "activity", label: "Activity" },
        ]}
        tab={tab}
        onTabChange={setTab}
        filter={<FilterMenu fields={fields} value={filters} onChange={setFilters} />}
        display={
          <DisplayMenu
            value={display}
            onChange={setDisplay}
            groupings={[{ value: "status", label: "Status" }]}
            orderings={[{ value: "priority", label: "Priority" }]}
          />
        }
        action={<IconButton icon={PlusSignIcon} label="New issue" variant="boxed" size="sm" />}
      />
    </div>
  );
}
