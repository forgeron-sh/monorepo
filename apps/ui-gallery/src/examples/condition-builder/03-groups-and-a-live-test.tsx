import { TrophyIcon } from "@forgeron/icons";
import {
  ConditionBuilder,
  describeCondition,
  evaluateCondition,
  variablesFromSample,
  type ConditionField,
  type ConditionGroup,
} from "@forgeron/ui";
import { useState } from "react";

const fields: ConditionField[] = [
  { id: "deal.amount", label: "Amount", type: "number" },
  {
    id: "deal.stage",
    label: "Stage",
    type: "enum",
    options: ["Lead", "Proposal", "Won", "Lost"].map((s) => ({ value: s, label: s })),
  },
  { id: "deal.company", label: "Company", type: "text" },
  { id: "deal.closedOn", label: "Closed on", type: "date" },
  { id: "deal.vip", label: "VIP client", type: "boolean" },
];
const deal = {
  amount: 9600,
  stage: "Won",
  company: "Transalp",
  closedOn: "2026-11-17",
  vip: false,
};

// The sentence and the result on the sample follow every change.
export default function GroupsAndALiveTest() {
  const [condition, setCondition] = useState<ConditionGroup>({
    id: "root",
    combinator: "and",
    rules: [
      { id: "a", field: "deal.stage", operator: "eq", value: "Won" },
      {
        id: "g",
        combinator: "or",
        rules: [
          { id: "b", field: "deal.amount", operator: "gte", value: "5000" },
          { id: "c", field: "deal.vip", operator: "is_true" },
        ],
      },
    ],
  });
  const passes = evaluateCondition(condition, { deal });
  return (
    <div style={{ display: "grid", gap: 16, width: "100%", maxWidth: 620 }}>
      <ConditionBuilder
        fields={fields}
        value={condition}
        onChange={setCondition}
        variables={[variablesFromSample("deal", "Deal moved to Won", deal, TrophyIcon)]}
      />
      <p className="t-small" style={{ margin: 0 }}>
        {describeCondition(condition, fields)}
        <br />
        <span className="t-mono dim">
          Transalp, €9,600: {passes ? "goes to true" : "goes to false"}
        </span>
      </p>
    </div>
  );
}
