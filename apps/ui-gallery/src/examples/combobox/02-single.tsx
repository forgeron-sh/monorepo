import { Combobox } from "@forgeron/ui";

const countries = [
  { value: "fr", label: "France", hint: "FR" },
  { value: "de", label: "Germany", hint: "DE" },
  { value: "es", label: "Spain", hint: "ES" },
  { value: "it", label: "Italy", hint: "IT" },
  { value: "pt", label: "Portugal", hint: "PT" },
  { value: "nl", label: "Netherlands", hint: "NL" },
];

export default function Single() {
  return (
    <Combobox
      label="Country"
      options={countries}
      placeholder="Search a country"
      defaultValue="fr"
    />
  );
}
