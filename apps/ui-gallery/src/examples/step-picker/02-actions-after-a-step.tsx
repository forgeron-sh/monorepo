import {
  CodeIcon,
  Database01Icon,
  GitForkIcon,
  GlobeIcon,
  HourglassIcon,
  Invoice01Icon,
  Mail01Icon,
  Message01Icon,
  RepeatIcon,
  Route01Icon,
  SparklesIcon,
  Task01Icon,
} from "@forgeron/icons";
import { Button, StepPicker } from "@forgeron/ui";
import { useState } from "react";

const options = [
  { id: "chat", group: "apps", icon: Message01Icon, app: "Chat", label: "Post a message" },
  { id: "mail", group: "apps", icon: Mail01Icon, app: "Mail relay", label: "Send an email" },
  { id: "task", group: "apps", icon: Task01Icon, app: "Tasks", label: "Create a task" },
  { id: "invoice", group: "apps", icon: Invoice01Icon, app: "Invoices", label: "Draft an invoice" },
  {
    id: "if",
    group: "logic",
    icon: GitForkIcon,
    label: "If",
    description: "Splits items on a condition",
  },
  {
    id: "switch",
    group: "logic",
    icon: Route01Icon,
    label: "Switch",
    description: "One path per value",
  },
  { id: "each", group: "logic", icon: RepeatIcon, label: "For each", description: "Once per item" },
  {
    id: "wait",
    group: "logic",
    icon: HourglassIcon,
    label: "Wait",
    description: "Pauses, then resumes",
  },
  { id: "query", group: "data", icon: Database01Icon, app: "Data hub", label: "Query a dataset" },
  { id: "http", group: "data", icon: GlobeIcon, app: "HTTP", label: "Call an API" },
  {
    id: "ai",
    group: "ai",
    icon: SparklesIcon,
    app: "AI Gateway",
    label: "Ask a model",
    tag: "beta",
  },
  {
    id: "carrier",
    group: "code",
    icon: CodeIcon,
    label: "Carrier rates",
    description: "flows/blocks/carrier-rates.ts",
    tag: "code",
  },
];

export default function ActionsAfterAStep() {
  const [picked, setPicked] = useState<string | null>(null);
  return (
    <div style={{ display: "grid", gap: 12, width: "100%", maxWidth: 380 }}>
      <StepPicker
        title="Add a step"
        context="After “Deal moved to Won”"
        groups={[
          { id: "apps", label: "Apps" },
          { id: "logic", label: "Logic" },
          { id: "data", label: "Data" },
          { id: "ai", label: "AI" },
          { id: "code", label: "Your code" },
        ]}
        options={options}
        onPick={setPicked}
        footer={
          <>
            <span style={{ flex: 1 }}>Missing a step? Write a function.</span>
            <Button size="sm">New step</Button>
          </>
        }
      />
      <span className="t-mono dim">Picked: {picked ?? "nothing yet"}</span>
    </div>
  );
}
