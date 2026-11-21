import { ApiIcon, Clock01Icon, TrophyIcon } from "@forgeron/icons";
import {
  StepPicker,
  StepPickerCategories,
  StepPickerEmpty,
  StepPickerHeader,
  StepPickerList,
  StepPickerSearch,
} from "@forgeron/ui";

// The root filters; the parts are placed where you want them (here, no footer).
export default function Default() {
  return (
    <div style={{ width: 340 }}>
      <StepPicker
        groups={[
          { id: "core", label: "Built in" },
          { id: "apps", label: "App events" },
        ]}
        options={[
          { id: "schedule", group: "core", icon: Clock01Icon, label: "Schedule" },
          { id: "webhook", group: "core", icon: ApiIcon, label: "Webhook" },
          { id: "deal", group: "apps", icon: TrophyIcon, app: "CRM", label: "Deal moved to Won" },
        ]}
        onPick={() => {}}
      >
        <StepPickerHeader title="Start with a trigger" />
        <StepPickerSearch autoFocus={false} placeholder="Search triggers" />
        <StepPickerCategories />
        <StepPickerEmpty>No trigger matches</StepPickerEmpty>
        <StepPickerList />
      </StepPicker>
    </div>
  );
}
