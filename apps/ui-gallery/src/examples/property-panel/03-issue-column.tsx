import { Folder01Icon } from "@forgeron/icons";
import {
  Avatar,
  DatePicker,
  LabelPicker,
  PersonPicker,
  PriorityPicker,
  PropertyPanel,
  PropertyText,
  QuarterPicker,
  SelectMenu,
  SizePicker,
  StatusPicker,
  type PriorityLevel,
  type SizeLevel,
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

const projects = [
  { value: "q4", label: "Q4 closing", icon: Folder01Icon },
  { value: "lyon", label: "Lyon depot", icon: Folder01Icon },
];

export default function IssueColumn() {
  const [status, setStatus] = useState<StatusKind>("review");
  const [priority, setPriority] = useState<PriorityLevel>(1);
  const [size, setSize] = useState<SizeLevel>(3);
  const [assignee, setAssignee] = useState<string | null>("hb");
  const [chosen, setChosen] = useState<string[]>(["customer", "bug"]);
  const [project, setProject] = useState<string | null>("q4");
  const [due, setDue] = useState<string | null>("2026-11-18");
  const [quarter, setQuarter] = useState<string | null>("2026-Q4");
  return (
    <div style={{ width: 260 }}>
      <PropertyPanel
        label="Properties of OPS-40"
        rows={[
          { heading: "Properties" },
          { label: "Status", control: <StatusPicker value={status} onChange={setStatus} /> },
          {
            label: "Priority",
            control: <PriorityPicker value={priority} onChange={setPriority} />,
          },
          {
            label: "Assignee",
            control: (
              <PersonPicker
                people={people}
                me="cr"
                noneLabel="No assignee"
                value={assignee}
                onChange={setAssignee}
              />
            ),
          },
          { label: "Size", control: <SizePicker value={size} onChange={setSize} /> },
          {
            label: "Due date",
            control: (
              <DatePicker label="Due date" today="2026-11-17" value={due} onChange={setDue} />
            ),
          },
          {
            label: "Quarter",
            control: (
              <QuarterPicker years={[2026, 2027]} clearable value={quarter} onChange={setQuarter} />
            ),
          },
          { heading: "Labels" },
          {
            label: "Labels",
            hideLabel: true,
            control: <LabelPicker labels={labels} value={chosen} onChange={setChosen} />,
          },
          { heading: "Project" },
          {
            label: "Project",
            hideLabel: true,
            control: (
              <SelectMenu
                label="Project"
                variant="chip"
                placeholder="Add to project"
                options={projects}
                value={project}
                onChange={setProject}
              />
            ),
          },
          { heading: "Created" },
          {
            label: "Created by",
            hideLabel: true,
            control: (
              <PropertyText dim glyph={<Avatar name="Camille Roy" size={16} />}>
                Camille Roy · 3 Nov
              </PropertyText>
            ),
          },
        ]}
      />
    </div>
  );
}
