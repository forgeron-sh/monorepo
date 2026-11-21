import { Message01Icon, TrophyIcon } from "@forgeron/icons";
import {
  StepFields,
  StepField,
  StepInspector,
  StepInspectorHeader,
  StepInspectorTabs,
  StepSettings,
  StepSettingsOnError,
  StepSettingsTimeout,
  variablesFromSample,
  type StepFieldSpec,
} from "@forgeron/ui";

const fields: StepFieldSpec[] = [
  {
    key: "channel",
    label: "Channel",
    type: "select",
    required: true,
    options: [
      { value: "sales", label: "#sales" },
      { value: "ops", label: "#lyon-depot" },
    ],
  },
  { key: "text", label: "Message", type: "text", required: true, typeLabel: "string" },
];

// The inspector keeps its header, its tabs and its footer; `StepFields` and `StepSettings` are
// parts too, and go in any other panel.
export default function Default() {
  return (
    <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-start" }}>
      <div style={{ width: 340 }}>
        <StepInspector
          icon={Message01Icon}
          title="Tell #sales"
          subtitle="Chat · postMessage()"
          fields={fields}
          defaultValues={{ channel: "sales", text: "Won {{ deal.name }}" }}
          variables={[
            variablesFromSample("deal", "Deal moved to Won", { name: "Transalp" }, TrophyIcon),
          ]}
        >
          <StepInspectorHeader />
          <StepInspectorTabs />
        </StepInspector>
      </div>
      <div style={{ width: 300, display: "grid", gap: 16 }}>
        <StepFields fields={fields} defaultValues={{ channel: "ops" }}>
          <StepField field={fields[0]!} />
        </StepFields>
        <StepSettings>
          <StepSettingsOnError />
          <StepSettingsTimeout />
        </StepSettings>
      </div>
    </div>
  );
}
