import { Select } from "@forgeron/ui";

const currencies = [
  { value: "eur", label: "Euro" },
  { value: "usd", label: "US dollar" },
  { value: "gbp", label: "Pound sterling" },
];

export default function States() {
  return (
    <>
      <Select options={currencies} defaultValue="eur" aria-label="Currency" />
      <Select options={currencies} defaultValue="usd" disabled aria-label="Currency, locked" />
    </>
  );
}
