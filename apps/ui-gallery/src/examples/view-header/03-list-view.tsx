import { BarChartIcon, Loading03Icon, PlusSignIcon, UserIcon } from "@forgeron/icons";
import {
  Avatar,
  Button,
  DisplayMenu,
  FilterBar,
  FilterMenu,
  Icon,
  PRIORITY_NAMES,
  PriorityGlyph,
  STATUS_NAMES,
  StatusGlyph,
  ViewHeader,
  type DisplayOptions,
  type Filter,
  type FilterField,
  type PriorityLevel,
  type StatusKind,
} from "@forgeron/ui";
import { useState } from "react";

const people = ["Camille Roy", "Hugo Bernard", "Léa Martin", "Nadia Petit", "Tom Garnier"];

const fields: FilterField[] = [
  {
    id: "status",
    label: "Status",
    icon: Loading03Icon,
    options: (["backlog", "todo", "progress", "review", "done"] as StatusKind[]).map((s) => ({
      value: s,
      label: STATUS_NAMES[s],
      glyph: <StatusGlyph status={s} />,
    })),
  },
  {
    id: "priority",
    label: "Priority",
    icon: BarChartIcon,
    options: ([1, 2, 3, 4, 0] as PriorityLevel[]).map((p) => ({
      value: String(p),
      label: PRIORITY_NAMES[p],
      glyph: <PriorityGlyph level={p} />,
    })),
  },
  {
    id: "assignee",
    label: "Assignee",
    icon: UserIcon,
    options: people.map((p) => ({ value: p, label: p, glyph: <Avatar name={p} size={16} /> })),
  },
];

export default function ListView() {
  const [tab, setTab] = useState("active");
  const [filters, setFilters] = useState<Filter[]>([
    { field: "assignee", operator: "is", values: ["Camille Roy"] },
  ]);
  const [display, setDisplay] = useState<DisplayOptions>({
    layout: "list",
    grouping: "status",
    ordering: "priority",
    toggles: { subIssues: true },
    properties: ["id", "status", "priority", "assignee"],
  });
  return (
    <div style={{ width: "100%", border: "1px solid var(--line)" }}>
      <ViewHeader
        breadcrumb={[{ label: "Operations", href: "#operations" }, { label: "Issues" }]}
        tabs={[
          { value: "all", label: "All issues" },
          { value: "active", label: "Active", count: 8 },
          { value: "backlog", label: "Backlog" },
        ]}
        tab={tab}
        onTabChange={setTab}
        filter={<FilterMenu fields={fields} value={filters} onChange={setFilters} />}
        display={
          <DisplayMenu
            value={display}
            onChange={setDisplay}
            groupings={[
              { value: "status", label: "Status" },
              { value: "assignee", label: "Assignee" },
              { value: "none", label: "No grouping" },
            ]}
            orderings={[
              { value: "priority", label: "Priority" },
              { value: "due", label: "Due date" },
            ]}
            toggles={[{ id: "subIssues", label: "Show sub-issues" }]}
            properties={[
              { id: "id", label: "ID" },
              { id: "status", label: "Status" },
              { id: "priority", label: "Priority" },
              { id: "assignee", label: "Assignee" },
            ]}
          />
        }
        action={
          <Button variant="primary" size="sm" kbd="C">
            <Icon icon={PlusSignIcon} size={12} variant="mono" />
            New issue
          </Button>
        }
      />
      <FilterBar fields={fields} value={filters} onChange={setFilters} />
      <div style={{ padding: 24, color: "var(--ink-muted)" }}>
        {display.layout === "list" ? "List" : "Board"} grouped by {display.grouping}, ordered by{" "}
        {display.ordering}.
      </div>
    </div>
  );
}
