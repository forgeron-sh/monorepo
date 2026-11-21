import {
  GitForkIcon,
  Invoice01Icon,
  Mail01Icon,
  Message01Icon,
  Task01Icon,
  TrophyIcon,
} from "@forgeron/icons";
import {
  Dialog,
  StepList,
  StepPicker,
  insertStep,
  type AutomationStep,
  type StepOption,
  type StepPlace,
} from "@forgeron/ui";
import { useState } from "react";

const actions: StepOption[] = [
  { id: "chat", group: "apps", icon: Message01Icon, app: "Chat", label: "Post a message" },
  { id: "mail", group: "apps", icon: Mail01Icon, app: "Mail relay", label: "Send an email" },
  { id: "task", group: "apps", icon: Task01Icon, app: "Tasks", label: "Create a task" },
  { id: "invoice", group: "apps", icon: Invoice01Icon, app: "Invoices", label: "Draft an invoice" },
];

const start: AutomationStep[] = [
  {
    id: "t",
    kind: "trigger",
    icon: TrophyIcon,
    title: "Deal moved to Won",
    subtitle: "CRM · onDealWon()",
  },
  {
    id: "if",
    kind: "logic",
    icon: GitForkIcon,
    title: "Above €5,000?",
    subtitle: "Flows · ifElse()",
    branches: [
      {
        id: "if-true",
        label: "true",
        steps: [
          { id: "cfo", icon: Mail01Icon, title: "Mail the CFO", subtitle: "Mail relay · send()" },
        ],
      },
      { id: "if-false", label: "false", steps: [] },
    ],
  },
  { id: "chat", icon: Message01Icon, title: "Tell #sales", subtitle: "Chat · postMessage()" },
];

let seq = 0;

// The list asks for a step at a place; the screen opens a picker and inserts what is picked.
// Alt + Up / Down moves the focused step, Delete removes it.
export default function EditorWithBranches() {
  const [steps, setSteps] = useState<ReadonlyArray<AutomationStep>>(start);
  const [selected, setSelected] = useState<string | null>("if");
  const [place, setPlace] = useState<StepPlace | null>(null);
  const pick = (id: string) => {
    const option = actions.find((a) => a.id === id);
    if (!option || !place) return;
    const step: AutomationStep = {
      id: `${id}-${(seq += 1)}`,
      icon: option.icon,
      title: option.label,
      subtitle: `${option.app} · ${id}()`,
    };
    setSteps(insertStep(steps, step, place));
    setSelected(step.id);
    setPlace(null);
  };
  return (
    <div style={{ width: "100%", maxWidth: 640, paddingTop: 10 }}>
      <StepList
        steps={steps}
        onChange={setSteps}
        selected={selected}
        onSelect={setSelected}
        onInsert={setPlace}
      />
      {place ? (
        <Dialog title="Add a step" onClose={() => setPlace(null)}>
          <StepPicker options={actions} categories={false} onPick={pick} autoFocus />
        </Dialog>
      ) : null}
    </div>
  );
}
