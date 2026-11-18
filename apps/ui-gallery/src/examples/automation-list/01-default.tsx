import { Clock01Icon, TrophyIcon } from "@forgeron/icons";
import { AutomationList } from "@forgeron/ui";

// Fewer columns for a narrow place: a side panel, a dashboard tile.
export default function Default() {
  return (
    <div style={{ width: 440 }}>
      <AutomationList
        columns={["state", "runs"]}
        onOpen={() => {}}
        automations={[
          {
            id: "won",
            name: "Won deal → invoice",
            meta: "Sales · v4",
            trigger: { label: "CRM · Deal moved to Won", icon: TrophyIcon },
            state: "active",
            runs: [3, 5, 2, 0, 0, 4, 6, 3, 5, 7, 2, 0, 0, 4],
          },
          {
            id: "rates",
            name: "Carrier rates",
            meta: "Operations · v7",
            trigger: { label: "Weekdays at 09:15", icon: Clock01Icon },
            state: "paused",
            runs: [1, 1, 1, 0, 0, 1, 2, 1, 1, 1, 0, 0, 1, 2],
            errors: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1],
          },
        ]}
      />
    </div>
  );
}
