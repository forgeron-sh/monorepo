import { MoneyInput, MoneyInputField, MoneyInputSymbol, NumberInputIncrement } from "@forgeron/ui";

// The symbol where you want it, the field, and the buttons of NumberInput if wanted.
export default function Composed() {
  return (
    <MoneyInput label="Price" currency="USD" defaultValue={4999}>
      <MoneyInputSymbol />
      <MoneyInputField />
      <NumberInputIncrement />
    </MoneyInput>
  );
}
