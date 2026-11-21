import {
  DatePicker,
  PersonPicker,
  PriorityPicker,
  PropertyPanel,
  StatusPicker,
} from "@forgeron/ui";

const people = [
  { id: "cr", name: "Camille Roy" },
  { id: "hb", name: "Hugo Bernard" },
];

export default function Default() {
  return (
    <div style={{ width: 240 }}>
      <PropertyPanel
        rows={[
          { label: "Status", control: <StatusPicker defaultValue="review" /> },
          { label: "Priority", control: <PriorityPicker defaultValue={1} /> },
          {
            label: "Assignee",
            control: (
              <PersonPicker people={people} me="cr" noneLabel="No assignee" defaultValue="hb" />
            ),
          },
          {
            label: "Due date",
            control: <DatePicker label="Due date" today="2026-11-17" defaultValue="2026-11-18" />,
          },
        ]}
      />
    </div>
  );
}
