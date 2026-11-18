import { Folder01Icon, Loading03Icon, UserIcon } from "@forgeron/icons";
import {
  Avatar,
  FilterBar,
  FilterMenu,
  STATUS_NAMES,
  StatusGlyph,
  type Filter,
  type FilterField,
  type StatusKind,
} from "@forgeron/ui";
import { useState } from "react";

const statuses: StatusKind[] = ["backlog", "todo", "progress", "review", "done"];
const people = ["Camille Roy", "Hugo Bernard", "Léa Martin", "Nadia Petit", "Tom Garnier"];

const fields: FilterField[] = [
  {
    id: "status",
    label: "Status",
    icon: Loading03Icon,
    options: statuses.map((s) => ({
      value: s,
      label: STATUS_NAMES[s],
      glyph: <StatusGlyph status={s} />,
    })),
  },
  {
    id: "assignee",
    label: "Assignee",
    icon: UserIcon,
    options: people.map((p) => ({ value: p, label: p, glyph: <Avatar name={p} size={16} /> })),
  },
  {
    id: "project",
    label: "Project",
    icon: Folder01Icon,
    options: ["Q4 closing", "Supplier portal", "Odoo bridge"].map((p) => ({ value: p, label: p })),
  },
];

export default function Default() {
  const [filters, setFilters] = useState<Filter[]>([
    { field: "status", operator: "is", values: ["todo", "progress"] },
  ]);
  return (
    <div style={{ display: "grid", justifyItems: "start", gap: 8, width: 300 }}>
      <FilterMenu fields={fields} value={filters} onChange={setFilters} />
      <FilterBar fields={fields} value={filters} onChange={setFilters} />
    </div>
  );
}
