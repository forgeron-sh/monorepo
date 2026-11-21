import { ApiIcon, Clock01Icon, PlayCircleIcon, Ticket01Icon, TrophyIcon } from "@forgeron/icons";
import { StepPicker } from "@forgeron/ui";

export default function Triggers() {
  return (
    <div style={{ width: 340 }}>
      <StepPicker
        title="Start with a trigger"
        placeholder="Search triggers"
        groups={[
          { id: "core", label: "Built in" },
          { id: "apps", label: "App events" },
        ]}
        options={[
          {
            id: "schedule",
            group: "core",
            icon: Clock01Icon,
            label: "Schedule",
            description: "Runs on a cron schedule",
          },
          {
            id: "webhook",
            group: "core",
            icon: ApiIcon,
            label: "Webhook",
            description: "A signed URL for any system",
          },
          {
            id: "manual",
            group: "core",
            icon: PlayCircleIcon,
            label: "Manual run",
            description: "Someone clicks Run",
          },
          { id: "deal", group: "apps", icon: TrophyIcon, app: "CRM", label: "Deal moved to Won" },
          {
            id: "ticket",
            group: "apps",
            icon: Ticket01Icon,
            app: "Helpdesk",
            label: "Ticket created",
          },
        ]}
        onPick={() => {}}
      />
    </div>
  );
}
