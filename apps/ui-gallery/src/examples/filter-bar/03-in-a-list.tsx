import {
  BarChartIcon,
  Calendar03Icon,
  Folder01Icon,
  HashtagIcon,
  Loading03Icon,
  UserIcon,
} from "@forgeron/icons";
import {
  Avatar,
  FilterBar,
  FilterMenu,
  matchesFilters,
  PRIORITY_NAMES,
  PriorityGlyph,
  STATUS_NAMES,
  StatusGlyph,
  type Filter,
  type FilterField,
  type PriorityLevel,
  type StatusKind,
} from "@forgeron/ui";
import { useState } from "react";

interface Issue {
  id: string;
  title: string;
  status: StatusKind;
  priority: PriorityLevel;
  assignee: string | null;
  labels: string[];
  project: string;
  due: string;
}

const issues: Issue[] = [
  {
    id: "OPS-41",
    title: "Reconcile November supplier invoices",
    status: "progress",
    priority: 1,
    assignee: "Camille Roy",
    labels: ["Bug"],
    project: "Q4 closing",
    due: "this-week",
  },
  {
    id: "OPS-38",
    title: "Portal sign-in for Garnier & Fils",
    status: "todo",
    priority: 2,
    assignee: "Hugo Bernard",
    labels: ["Feature", "Customer"],
    project: "Supplier portal",
    due: "next-week",
  },
  {
    id: "OPS-35",
    title: "Sync stock moves to Odoo every hour",
    status: "review",
    priority: 3,
    assignee: "Léa Martin",
    labels: ["Improvement"],
    project: "Odoo bridge",
    due: "overdue",
  },
  {
    id: "OPS-33",
    title: "Count pallets in the north warehouse",
    status: "todo",
    priority: 4,
    assignee: null,
    labels: ["Warehouse"],
    project: "Q4 closing",
    due: "none",
  },
  {
    id: "OPS-29",
    title: "Map Odoo taxes to the ledger",
    status: "backlog",
    priority: 0,
    assignee: "Nadia Petit",
    labels: [],
    project: "Odoo bridge",
    due: "none",
  },
];

const people = ["Camille Roy", "Hugo Bernard", "Léa Martin", "Nadia Petit", "Tom Garnier"];
const labels: Array<[string, string]> = [
  ["Bug", "var(--danger)"],
  ["Feature", "var(--accent)"],
  ["Improvement", "var(--ink-muted)"],
  ["Customer", "var(--success)"],
  ["Warehouse", "var(--warning)"],
];
const count = (pick: (i: Issue) => boolean) => String(issues.filter(pick).length);
const swatch = (color: string) => <span className="fg-swatch-mark" style={{ background: color }} />;

const fields: FilterField[] = [
  {
    id: "status",
    label: "Status",
    icon: Loading03Icon,
    options: (["backlog", "todo", "progress", "review", "done"] as StatusKind[]).map((s) => ({
      value: s,
      label: STATUS_NAMES[s],
      glyph: <StatusGlyph status={s} />,
      hint: count((i) => i.status === s),
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
      hint: count((i) => i.priority === p),
    })),
  },
  {
    id: "assignee",
    label: "Assignee",
    icon: UserIcon,
    options: [
      { value: "_", label: "No assignee", glyph: <span className="fg-av-none" /> },
      ...people.map((p) => ({
        value: p,
        label: p === "Camille Roy" ? `${p} (you)` : p,
        glyph: <Avatar name={p} size={16} />,
        hint: count((i) => i.assignee === p),
      })),
    ],
  },
  {
    id: "labels",
    label: "Labels",
    icon: HashtagIcon,
    options: labels.map(([name, color]) => ({
      value: name,
      label: name,
      glyph: swatch(color),
      hint: count((i) => i.labels.includes(name)),
    })),
  },
  {
    id: "project",
    label: "Project",
    icon: Folder01Icon,
    options: ["Q4 closing", "Supplier portal", "Odoo bridge"].map((p) => ({
      value: p,
      label: p,
      hint: count((i) => i.project === p),
    })),
  },
  {
    id: "due",
    label: "Due date",
    icon: Calendar03Icon,
    options: [
      { value: "overdue", label: "Overdue" },
      { value: "this-week", label: "Due this week" },
      { value: "next-week", label: "Due next week" },
      { value: "none", label: "No due date" },
    ],
  },
];

/** The value of an issue for a field, as the filters read it: a string, a list, or null. */
const read = (issue: Issue) => {
  const values: Record<string, string | string[] | null> = {
    ...issue,
    priority: String(issue.priority),
  };
  return (field: string) => values[field] ?? null;
};

export default function InAList() {
  const [filters, setFilters] = useState<Filter[]>([
    { field: "status", operator: "is", values: ["todo", "progress", "review"] },
    { field: "labels", operator: "is-not", values: ["Warehouse"] },
  ]);
  const shown = issues.filter((i) => matchesFilters(filters, read(i)));
  return (
    <div style={{ width: "100%", border: "1px solid var(--line)" }}>
      <div style={{ display: "flex", padding: 8, borderBottom: "1px solid var(--line)" }}>
        <FilterMenu fields={fields} value={filters} onChange={setFilters} />
      </div>
      <FilterBar fields={fields} value={filters} onChange={setFilters} />
      <ul style={{ margin: 0, padding: 8, listStyle: "none", display: "grid", gap: 2 }}>
        {shown.map((i) => (
          <li
            key={i.id}
            style={{ display: "flex", alignItems: "center", gap: 10, height: 36, padding: "0 8px" }}
          >
            <PriorityGlyph level={i.priority} />
            <span style={{ color: "var(--ink-dim)", font: "400 12px var(--font-mono)" }}>
              {i.id}
            </span>
            <StatusGlyph status={i.status} />
            <span style={{ flex: 1 }}>{i.title}</span>
            {i.assignee ? <Avatar name={i.assignee} size={18} /> : null}
          </li>
        ))}
        {shown.length === 0 ? (
          <li style={{ padding: 16, color: "var(--ink-muted)" }}>No issues match these filters</li>
        ) : null}
      </ul>
    </div>
  );
}
