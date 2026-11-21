import { ApprovalChain, type ApprovalStep } from "@forgeron/ui";
import { useState } from "react";

const people = [
  { id: "lea", name: "Léa Martin", role: "Team lead" },
  { id: "karim", name: "Karim Aziz", role: "Controller" },
  { id: "jo", name: "Jo Bernard", role: "Accounting" },
  { id: "sam", name: "Sam Roche", role: "Director" },
];

export default function Editable() {
  const [steps, setSteps] = useState<ApprovalStep[]>([
    { id: "s1", label: "Review", participants: [people[0]!, people[1]!] },
  ]);
  return (
    <div style={{ width: "100%", maxWidth: 640 }}>
      <ApprovalChain
        label="Approval flow"
        editable
        people={people}
        value={steps}
        onChange={setSteps}
        onComment={() => {}}
      />
    </div>
  );
}
