import {
  IconPicker,
  IconPickerContent,
  IconPickerFooter,
  IconPickerGrid,
  IconPickerHeader,
  IconPickerSearch,
  IconPickerTrigger,
} from "@forgeron/ui";

// The parts: an IconPicker whose children are parts is the root; drop the ones you do not want.
export default function Composed() {
  return (
    <IconPicker label="Page icon" defaultValue="rocket-01">
      <IconPickerTrigger />
      <IconPickerContent>
        <IconPickerHeader>Page icon</IconPickerHeader>
        <IconPickerSearch />
        <IconPickerGrid />
        <IconPickerFooter />
      </IconPickerContent>
    </IconPicker>
  );
}
