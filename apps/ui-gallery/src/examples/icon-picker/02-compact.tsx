import { IconPicker } from "@forgeron/ui";

export default function Compact() {
  return (
    <>
      <IconPicker label="Page icon" defaultValue="rocket-01" />
      <IconPicker label="Project icon" variant="chip" defaultValue="anvil" />
    </>
  );
}
