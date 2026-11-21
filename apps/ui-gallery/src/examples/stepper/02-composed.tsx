import { Stepper, StepperDecrement, StepperField, StepperIncrement } from "@forgeron/ui";

// Without `value`, Stepper is the root of its parts: the plus on the left, for instance.
export default function Composed() {
  return (
    <Stepper label="Rooms">
      <StepperIncrement />
      <StepperField defaultValue={2} />
      <StepperDecrement />
    </Stepper>
  );
}
