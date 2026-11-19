import { AmountBadge, StatusBadge } from "@forgeron/ui";

export default function Default() {
  return (
    <div style={{ display: "grid", gap: 8 }}>
      <AmountBadge amount={125000} currency="EUR" locale="en" />
      <AmountBadge amount={-4250} currency="EUR" locale="en" />
      <AmountBadge amount={-4250} currency="EUR" locale="en" invert />
      <AmountBadge amount={0} currency="EUR" locale="en" />
      <div style={{ display: "flex", gap: 8 }}>
        <StatusBadge status="draft" />
        <StatusBadge status="sent" />
        <StatusBadge status="paid" />
        <StatusBadge status="overdue" />
      </div>
    </div>
  );
}
