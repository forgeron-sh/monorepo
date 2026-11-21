import {
  CurrencyPicker,
  CurrencyPickerItem,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "@forgeron/ui";

// With children, CurrencyPicker is the Select root: the trigger and the list are yours.
const items = [
  { value: "EUR", label: "EUR" },
  { value: "USD", label: "USD" },
  { value: "GBP", label: "GBP" },
];

export default function Composed() {
  return (
    <CurrencyPicker items={items} defaultValue="EUR">
      <SelectTrigger className="w-40">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {items.map((i) => (
          <CurrencyPickerItem key={i.value} code={i.value} locale="en" />
        ))}
      </SelectContent>
    </CurrencyPicker>
  );
}
