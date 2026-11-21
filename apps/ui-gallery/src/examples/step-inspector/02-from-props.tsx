import { Message01Icon, TrophyIcon } from "@forgeron/icons";
import { StepInspector, variablesFromSample } from "@forgeron/ui";

export default function Default() {
  return (
    <div style={{ width: 340 }}>
      <StepInspector
        icon={Message01Icon}
        title="Tell #sales"
        subtitle="Chat · postMessage()"
        fields={[
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
        ]}
        defaultValues={{ channel: "sales", text: "Won {{ deal.name }}" }}
        variables={[
          variablesFromSample(
            "deal",
            "Deal moved to Won",
            { name: "Transalp", amount: 9600 },
            TrophyIcon,
          ),
        ]}
      />
    </div>
  );
}
