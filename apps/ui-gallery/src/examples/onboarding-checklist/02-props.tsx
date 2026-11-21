import { OnboardingChecklist, type OnboardingStep } from "@forgeron/ui";
import { useState } from "react";

const initial: OnboardingStep[] = [
  { id: "create", title: "Create a board", done: true },
  {
    id: "invite",
    title: "Invite a teammate",
    description: "Share the link so they can join in.",
  },
  { id: "comment", title: "Leave a comment", description: "Drop a pin on anything." },
  { id: "export", title: "Export as PNG", description: "From the File menu." },
];

export default function Default() {
  const [steps, setSteps] = useState(initial);
  const set = (id: string, done: boolean) =>
    setSteps((list) => list.map((s) => (s.id === id ? { ...s, done } : s)));
  return (
    <div style={{ width: "100%", maxWidth: 400 }}>
      <OnboardingChecklist
        title="Get started"
        steps={steps.map((s) => ({
          ...s,
          action: s.done ? undefined : { label: "Do it", onClick: () => set(s.id, true) },
        }))}
        onMarkDone={(id) => set(id, true)}
        onMarkUndone={(id) => set(id, false)}
        onDismiss={() => setSteps(initial)}
      />
    </div>
  );
}
