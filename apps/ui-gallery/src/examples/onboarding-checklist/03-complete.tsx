import { OnboardingChecklist } from "@forgeron/ui";

export default function Complete() {
  return (
    <div style={{ width: "100%", maxWidth: 400 }}>
      <OnboardingChecklist
        title="Get started"
        defaultCollapsed
        steps={[
          { id: "a", title: "Create a board", done: true },
          { id: "b", title: "Invite a teammate", done: true },
        ]}
        completeMessage="All done. You know your way around."
      />
    </div>
  );
}
