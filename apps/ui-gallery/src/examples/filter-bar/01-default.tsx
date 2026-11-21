import { Folder01Icon, Loading03Icon } from "@forgeron/icons";
import {
  FilterBar,
  FilterBarAdd,
  FilterBarChips,
  FilterBarClear,
  FilterBarGap,
  FilterMenu,
  type Filter,
  type FilterField,
} from "@forgeron/ui";
import { useState } from "react";

const fields: FilterField[] = [
  {
    id: "status",
    label: "Status",
    icon: Loading03Icon,
    options: ["Todo", "In Progress", "Done"].map((s) => ({ value: s, label: s })),
  },
  {
    id: "project",
    label: "Project",
    icon: Folder01Icon,
    options: ["Q4 closing", "Supplier portal"].map((p) => ({ value: p, label: p })),
  },
];

export default function Composed() {
  const [filters, setFilters] = useState<Filter[]>([
    { field: "status", operator: "is", values: ["Todo", "In Progress"] },
  ]);
  return (
    <div style={{ display: "grid", justifyItems: "start", gap: 8, width: 300 }}>
      <FilterMenu fields={fields} value={filters} onChange={setFilters} />
      <FilterBar fields={fields} value={filters} onChange={setFilters}>
        <FilterBarChips />
        <FilterBarAdd />
        <FilterBarGap />
        <FilterBarClear />
      </FilterBar>
    </div>
  );
}
