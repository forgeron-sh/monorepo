import {
  Button,
  CreateDialog,
  DatePicker,
  LabelPicker,
  PersonPicker,
  PriorityPicker,
  StatusPicker,
} from "@forgeron/ui";
import { useState } from "react";

const people = [
  { id: "cr", name: "Camille Roy" },
  { id: "hb", name: "Hugo Bernard" },
  { id: "np", name: "Nadia Petit" },
];

const labels = [
  { value: "bug", label: "Bug", color: "var(--danger)" },
  { value: "customer", label: "Customer", color: "var(--success)" },
];

export default function Default() {
  const [open, setOpen] = useState(false);
  const [last, setLast] = useState<string | null>(null);
  return (
    <div style={{ display: "grid", gap: 10, justifyItems: "start" }}>
      <CreateDialog
        open={open}
        onOpenChange={setOpen}
        trigger={<Button variant="primary">New issue</Button>}
        onSubmit={(draft) => setLast(draft.title)}
        properties={
          <>
            <StatusPicker defaultValue="todo" />
            <PriorityPicker defaultValue={0} />
            <PersonPicker people={people} me="cr" noneLabel="Assignee" defaultValue={null} />
            <LabelPicker labels={labels} />
            <DatePicker label="Due date" today="2026-11-17" />
          </>
        }
      />
      {last ? <span style={{ color: "var(--ink-muted)" }}>Created: {last}</span> : null}
    </div>
  );
}
