import {
  ConditionBuilder,
  ConditionBuilderGroup,
  type ConditionField,
  emptyCondition,
} from "@forgeron/ui";
import { useState } from "react";

const fields: ConditionField[] = [
  { id: "deal.amount", label: "Amount", type: "number" },
  { id: "deal.company", label: "Company", type: "text" },
];

// The group is a part: `ConditionBuilderGroup` alone draws the root; nested groups draw themselves.
export default function Composed() {
  const [value, setValue] = useState(emptyCondition);
  return (
    <div style={{ width: 520 }}>
      <ConditionBuilder fields={fields} value={value} onChange={setValue} label="Send when">
        <ConditionBuilderGroup />
      </ConditionBuilder>
    </div>
  );
}
