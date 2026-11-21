import { TrophyIcon } from "@forgeron/icons";
import { ExpressionInput, variablesFromSample } from "@forgeron/ui";

const deal = { id: 4182, name: "Transalp", amount: 9600, owner: { name: "Léa Martin" } };

export default function Default() {
  return (
    <div style={{ width: 320 }}>
      <ExpressionInput
        aria-label="Subject"
        defaultValue="Won: {{ deal.name }}"
        variables={[variablesFromSample("deal", "Deal moved to Won", deal, TrophyIcon)]}
      />
    </div>
  );
}
