import { ApiIcon, Clock01Icon, TrophyIcon } from "@forgeron/icons";
import { AutomationList } from "@forgeron/ui";

export default function Full() {
  return (
    <div style={{ width: "100%", maxWidth: 980 }}>
      <AutomationList
        onOpen={() => {}}
        automations={[
          {
            id: "won",
            name: "Won deal → invoice",
            meta: "Sales · 6 steps · v4",
            trigger: { label: "CRM · Deal moved to Won", icon: TrophyIcon },
            state: "active",
            lastRun: { status: "success", ago: "4 min ago", durationMs: 612 },
            runs: [3, 5, 2, 0, 0, 4, 6, 3, 5, 7, 2, 0, 0, 4],
            owner: "Camille Roy",
          },
          {
            id: "rates",
            name: "Carrier rates",
            meta: "Operations · 4 steps · v7",
            trigger: { label: "Weekdays at 09:15", icon: Clock01Icon },
            state: "active",
            lastRun: { status: "error", ago: "1 h ago", durationMs: 1840 },
            runs: [1, 1, 1, 0, 0, 1, 2, 1, 1, 1, 0, 0, 1, 2],
            errors: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1],
            owner: "Hugo Bernard",
          },
          {
            id: "partner",
            name: "Partner sync",
            meta: "Operations · 3 steps",
            trigger: { label: "Webhook POST", icon: ApiIcon },
            state: "draft",
            owner: "Léa Martin",
          },
        ]}
      />
    </div>
  );
}
