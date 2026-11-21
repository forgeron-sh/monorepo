import { Combobox, type ComboboxOption } from "@forgeron/ui";
import { useState } from "react";

const labels: ComboboxOption[] = [
  { value: "bug", label: "bug" },
  { value: "docs", label: "documentation" },
  { value: "design", label: "design" },
  { value: "infra", label: "infrastructure" },
];

export default function MultipleCreatable() {
  const [chosen, setChosen] = useState<string[]>(["bug"]);
  const [options, setOptions] = useState(labels);
  return (
    <Combobox
      multiple
      label="Labels"
      placeholder="Add a label"
      options={options}
      value={chosen}
      onChange={setChosen}
      onCreate={(text) => {
        const made = { value: text.toLowerCase().replace(/\s+/g, "-"), label: text };
        setOptions((o) => [...o, made]);
        return made;
      }}
    />
  );
}
