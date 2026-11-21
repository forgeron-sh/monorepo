import {
  DatePicker,
  LabelPicker,
  PersonPicker,
  PriorityPicker,
  PropertyChips,
  StatusPicker,
} from "@forgeron/ui";

const people = [
  { id: "cr", name: "Camille Roy" },
  { id: "hb", name: "Hugo Bernard" },
  { id: "np", name: "Nadia Petit" },
];

const labels = [
  { value: "bug", label: "Bug", color: "var(--danger)" },
  { value: "customer", label: "Customer", color: "var(--success)" },
];

export default function Chips() {
  return (
    <div style={{ width: "100%", display: "grid", gap: 12 }}>
      <h3 style={{ margin: 0, font: "600 24px/32px var(--font-sans)", letterSpacing: "-0.015em" }}>
        Supplier invoices arrive twice from Odoo
      </h3>
      <PropertyChips label="Properties of OPS-40">
        <StatusPicker defaultValue="review" />
        <PriorityPicker defaultValue={1} />
        <PersonPicker people={people} me="cr" noneLabel="No assignee" defaultValue="hb" />
        <LabelPicker labels={labels} defaultValue={["customer", "bug"]} />
        <DatePicker label="Due date" today="2026-11-17" defaultValue="2026-11-18" />
      </PropertyChips>
    </div>
  );
}
