import { LabelPicker } from "@forgeron/ui";

const labels = [
  { value: "bug", label: "Bug", color: "var(--danger)" },
  { value: "feature", label: "Feature", color: "var(--accent)" },
  { value: "improve", label: "Improvement", color: "var(--ink-muted)" },
  { value: "customer", label: "Customer", color: "var(--success)" },
  { value: "ops", label: "Warehouse", color: "var(--warning)" },
];

export default function Default() {
  return <LabelPicker labels={labels} defaultValue={["bug", "customer"]} />;
}
