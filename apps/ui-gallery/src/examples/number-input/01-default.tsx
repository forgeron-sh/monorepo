import {
  NumberInput,
  NumberInputAffix,
  NumberInputDecrement,
  NumberInputField,
  NumberInputIncrement,
} from "@forgeron/ui";

// With children, NumberInput is the root of the parts: buttons, a unit and the field.
export default function Composed() {
  return (
    <NumberInput label="Weight" defaultValue={12} min={0} max={100}>
      <NumberInputDecrement />
      <NumberInputField />
      <NumberInputAffix>kg</NumberInputAffix>
      <NumberInputIncrement />
    </NumberInput>
  );
}
