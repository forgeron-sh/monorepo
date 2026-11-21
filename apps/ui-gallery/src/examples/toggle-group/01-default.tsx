import { ToggleGroup, ToggleGroupItem } from "@forgeron/ui";

export default function Default() {
  return (
    <ToggleGroup variant="outline" multiple defaultValue={["bold"]}>
      <ToggleGroupItem value="bold" aria-label="Toggle bold">
        Bold
      </ToggleGroupItem>
      <ToggleGroupItem value="italic" aria-label="Toggle italic">
        Italic
      </ToggleGroupItem>
      <ToggleGroupItem value="underline" aria-label="Toggle underline">
        Underline
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
