import {
  DatePicker,
  PersonPicker,
  PriorityPicker,
  QuarterPicker,
  StatusPicker,
} from "@forgeron/ui";

export default function InARecord() {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, maxWidth: 560 }}>
      <StatusPicker defaultValue="review" />
      <PriorityPicker defaultValue={1} />
      <PersonPicker people={[{ id: "hb", name: "Hugo Bernard" }]} defaultValue="hb" />
      <QuarterPicker years={[2026]} defaultValue="2026-Q4" />
      <DatePicker label="Due date" today="2026-11-17" defaultValue="2026-11-18" />
    </div>
  );
}
