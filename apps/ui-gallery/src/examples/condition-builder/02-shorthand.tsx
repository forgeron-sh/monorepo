import { ConditionBuilder, type ConditionField } from "@forgeron/ui";

const fields: ConditionField[] = [
  { id: "deal.amount", label: "Amount", type: "number" },
  {
    id: "deal.stage",
    label: "Stage",
    type: "enum",
    options: [
      { value: "won", label: "Won" },
      { value: "lost", label: "Lost" },
    ],
  },
  { id: "deal.company", label: "Company", type: "text" },
];

export default function Default() {
  return (
    <div style={{ width: 520 }}>
      <ConditionBuilder
        fields={fields}
        maxDepth={1}
        defaultValue={{
          id: "root",
          combinator: "and",
          rules: [
            { id: "a", field: "deal.amount", operator: "gt", value: "5000" },
            { id: "b", field: "deal.stage", operator: "eq", value: "won" },
          ],
        }}
      />
    </div>
  );
}
