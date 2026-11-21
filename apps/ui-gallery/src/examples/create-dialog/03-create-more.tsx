import { Attachment01Icon, Folder01Icon, UserGroupIcon } from "@forgeron/icons";
import {
  Button,
  CreateDialog,
  DatePicker,
  IconButton,
  LabelPicker,
  PersonPicker,
  PriorityPicker,
  SelectMenu,
  StatusPicker,
  type PriorityLevel,
  type StatusKind,
} from "@forgeron/ui";
import { useState } from "react";

const people = [
  { id: "cr", name: "Camille Roy" },
  { id: "hb", name: "Hugo Bernard" },
  { id: "lm", name: "Léa Martin" },
  { id: "np", name: "Nadia Petit" },
  { id: "tg", name: "Tom Garnier" },
];

const labels = [
  { value: "bug", label: "Bug", color: "var(--danger)" },
  { value: "customer", label: "Customer", color: "var(--success)" },
  { value: "feature", label: "Feature", color: "var(--accent)" },
];

const teams = [
  { value: "OPS", label: "OPS", icon: UserGroupIcon, hint: "Operations" },
  { value: "FIN", label: "FIN", icon: UserGroupIcon, hint: "Finance" },
];

const projects = [{ value: "q4", label: "Q4 closing", icon: Folder01Icon }];

export default function CreateMore() {
  const [open, setOpen] = useState(false);
  const [team, setTeam] = useState<string | null>("OPS");
  const [status, setStatus] = useState<StatusKind>("todo");
  const [priority, setPriority] = useState<PriorityLevel>(0);
  const [assignee, setAssignee] = useState<string | null>(null);
  const [chosen, setChosen] = useState<string[]>([]);
  const [project, setProject] = useState<string | null>("q4");
  const [due, setDue] = useState<string | null>(null);
  const [more, setMore] = useState(true);
  const [created, setCreated] = useState<string[]>([]);
  return (
    <div style={{ width: "100%", display: "grid", gap: 12, justifyItems: "start" }}>
      <CreateDialog
        open={open}
        onOpenChange={setOpen}
        trigger={<Button kbd="C">New issue</Button>}
        context={
          <SelectMenu label="Team" variant="chip" options={teams} value={team} onChange={setTeam} />
        }
        createMore={more}
        onCreateMoreChange={setMore}
        onSubmit={(draft) =>
          setCreated((list) => [...list, `${team}-${41 + list.length} ${draft.title}`])
        }
        footerStart={<IconButton icon={Attachment01Icon} label="Attach a file" size="sm" />}
        properties={
          <>
            <StatusPicker value={status} onChange={setStatus} />
            <PriorityPicker value={priority} onChange={setPriority} />
            <PersonPicker
              people={people}
              me="cr"
              noneLabel="Assignee"
              value={assignee}
              onChange={setAssignee}
            />
            <SelectMenu
              label="Project"
              variant="chip"
              placeholder="Project"
              options={projects}
              value={project}
              onChange={setProject}
            />
            <LabelPicker labels={labels} value={chosen} onChange={setChosen} />
            <DatePicker label="Due date" today="2026-11-17" value={due} onChange={setDue} />
          </>
        }
      />
      {created.length > 0 ? (
        <ul style={{ margin: 0, paddingLeft: 16, color: "var(--ink-muted)" }}>
          {created.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
