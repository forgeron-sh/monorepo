import { GitForkIcon, Message01Icon, TrophyIcon } from "@forgeron/icons";
import {
  insertStep,
  StepList,
  StepListEmpty,
  StepListSteps,
  type AutomationStep,
  type StepPlace,
} from "@forgeron/ui";
import { useState } from "react";

// Every card is an item of one collection: one tab stop, the arrows move, Enter opens, Alt with an
// arrow moves the step, Delete removes it. The tree stays in the root; the parts draw it.
export default function Default() {
  const [steps, setSteps] = useState<ReadonlyArray<AutomationStep>>([
    { id: "t", kind: "trigger", icon: TrophyIcon, title: "Deal moved to Won" },
    { id: "if", kind: "logic", icon: GitForkIcon, title: "Above €5,000?" },
    { id: "chat", icon: Message01Icon, title: "Tell #sales" },
  ]);
  const [selected, setSelected] = useState<string | null>("if");
  const add = (place: StepPlace) =>
    setSteps(
      insertStep(steps, { id: `s${Date.now()}`, icon: Message01Icon, title: "New step" }, place),
    );
  return (
    <div style={{ width: 340, paddingTop: 10 }}>
      <StepList
        steps={steps}
        onChange={setSteps}
        selected={selected}
        onSelect={setSelected}
        onInsert={add}
      >
        <StepListEmpty>Start with a trigger</StepListEmpty>
        <StepListSteps />
      </StepList>
    </div>
  );
}
