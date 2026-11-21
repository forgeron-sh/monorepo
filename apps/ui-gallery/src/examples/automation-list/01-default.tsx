import { Clock01Icon, TrophyIcon } from "@forgeron/icons";
import {
  AutomationList,
  AutomationListActions,
  AutomationListBody,
  AutomationListHeader,
  AutomationListName,
  AutomationListRow,
  AutomationListRuns,
  AutomationListState,
  type AutomationSummary,
} from "@forgeron/ui";

const automations: AutomationSummary[] = [
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
];

// The rows and their cells are parts of a Table: pick the cells, in the order you want.
export default function Default() {
  return (
    <div style={{ width: 520 }}>
      <AutomationList onOpen={() => {}} renderActions={() => <button type="button">Run</button>}>
        <AutomationListHeader />
        <AutomationListBody>
          {automations.map((a) => (
            <AutomationListRow key={a.id} automation={a}>
              <AutomationListName />
              <AutomationListState />
              <AutomationListRuns />
              <AutomationListActions />
            </AutomationListRow>
          ))}
        </AutomationListBody>
      </AutomationList>
    </div>
  );
}
