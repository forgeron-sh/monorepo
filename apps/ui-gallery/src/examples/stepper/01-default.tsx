import { Stepper } from "@forgeron/ui";

// Markup only: the page wires the buttons (data-step) and reads the field.
export default function Default() {
  return <Stepper label="People on the team" value={10} data-stepper="people" />;
}
