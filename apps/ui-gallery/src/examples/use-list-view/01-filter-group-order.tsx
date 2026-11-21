// The state of a view without its chrome: filters, grouping and ordering applied to plain records.
import { FilterBar, FilterMenu, useListView, type ViewSpec } from "@forgeron/ui";
import { Loading03Icon } from "@forgeron/icons";

interface Lead {
  name: string;
  stage: string;
  value: number;
}
const leads: Lead[] = [
  { name: "Atelier Morel", stage: "won", value: 12_000 },
  { name: "Brasserie du Port", stage: "proposal", value: 8_400 },
  { name: "Clinique Saint-Luc", stage: "proposal", value: 31_000 },
  { name: "Domaine Vidal", stage: "new", value: 4_200 },
];
const STAGES = ["new", "proposal", "won"];

const spec: ViewSpec<Lead> = {
  read: (lead, field) => (field === "stage" ? lead.stage : null),
  groupings: { stage: { key: (l) => l.stage, order: STAGES } },
  orderings: { value: (a, b) => b.value - a.value },
};

export default function FilterGroupOrder() {
  const view = useListView(leads, spec, {
    defaultDisplay: {
      layout: "list",
      grouping: "stage",
      ordering: "value",
      toggles: {},
      properties: [],
    },
  });
  const fields = [
    {
      id: "stage",
      label: "Stage",
      icon: Loading03Icon,
      options: STAGES.map((s) => ({ value: s, label: s })),
    },
  ];
  return (
    <div style={{ width: "100%", maxWidth: 420, display: "grid", gap: 8 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <FilterMenu fields={fields} value={view.filters} onChange={view.setFilters} />
      </div>
      <FilterBar fields={fields} value={view.filters} onChange={view.setFilters} />
      {view.groups.map((g) => (
        <section key={g.key}>
          <p
            className="t-mono"
            style={{ margin: "8px 0 4px", color: "var(--ink-dim)", fontSize: 11 }}
          >
            {g.name.toUpperCase()}
          </p>
          {g.records.map((l) => (
            <p
              key={l.name}
              style={{ margin: 0, display: "flex", justifyContent: "space-between", fontSize: 13 }}
            >
              {l.name} <span className="t-mono">{l.value.toLocaleString("en")}</span>
            </p>
          ))}
        </section>
      ))}
    </div>
  );
}
