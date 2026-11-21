import { TrophyIcon } from "@forgeron/icons";
import {
  ExpressionInput,
  ExpressionInputBox,
  ExpressionInputField,
  ExpressionInputList,
  ExpressionInputPreview,
  ExpressionInputTrigger,
  variablesFromSample,
} from "@forgeron/ui";

const deal = { id: 4182, name: "Transalp", amount: 9600 };

export default function Composed() {
  return (
    <div style={{ width: 320 }}>
      <ExpressionInput
        aria-label="Subject"
        defaultValue="Won: {{ deal.name }}"
        sample={{ deal }}
        variables={[variablesFromSample("deal", "Deal moved to Won", deal, TrophyIcon)]}
      >
        <ExpressionInputBox>
          <ExpressionInputField />
          <ExpressionInputTrigger />
          <ExpressionInputList />
        </ExpressionInputBox>
        <ExpressionInputPreview />
      </ExpressionInput>
    </div>
  );
}
