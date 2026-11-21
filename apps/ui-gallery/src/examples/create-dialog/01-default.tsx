// Composed from parts: the trigger, the modal, its header, and the form's own title, description,
// properties and footer. Each part reads the draft the form keeps.
import {
  Button,
  CreateDialog,
  CreateDialogClose,
  CreateDialogContent,
  CreateDialogDescription,
  CreateDialogFooter,
  CreateDialogForm,
  CreateDialogHeader,
  CreateDialogHeading,
  CreateDialogMore,
  CreateDialogProperties,
  CreateDialogSubmit,
  CreateDialogTitle,
  CreateDialogTrigger,
  PersonPicker,
  PriorityPicker,
  StatusPicker,
} from "@forgeron/ui";
import { useState } from "react";

const people = [
  { id: "cr", name: "Camille Roy" },
  { id: "hb", name: "Hugo Bernard" },
];

export default function Composed() {
  const [open, setOpen] = useState(false);
  const [last, setLast] = useState<string | null>(null);
  return (
    <div style={{ display: "grid", gap: 10, justifyItems: "start" }}>
      <CreateDialog
        open={open}
        onOpenChange={setOpen}
        onSubmit={(draft) => setLast(draft.title)}
        submitLabel="Create lead"
        titlePlaceholder="Lead name"
      >
        <CreateDialogTrigger asChild>
          <Button variant="primary">New lead</Button>
        </CreateDialogTrigger>
        <CreateDialogContent size="sm">
          <CreateDialogHeader>
            <CreateDialogHeading>New lead</CreateDialogHeading>
            <CreateDialogClose />
          </CreateDialogHeader>
          <CreateDialogForm>
            <CreateDialogTitle />
            <CreateDialogDescription />
            <CreateDialogProperties>
              <StatusPicker defaultValue="todo" />
              <PriorityPicker defaultValue={0} />
              <PersonPicker people={people} me="cr" noneLabel="Owner" defaultValue={null} />
            </CreateDialogProperties>
            <CreateDialogFooter>
              <CreateDialogMore />
              <CreateDialogSubmit />
            </CreateDialogFooter>
          </CreateDialogForm>
        </CreateDialogContent>
      </CreateDialog>
      {last ? <span style={{ color: "var(--ink-muted)" }}>Created: {last}</span> : null}
    </div>
  );
}
