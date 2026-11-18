// A few types, as a chip in a dense row.
import { FieldTypePicker } from "@forgeron/ui";

export default function Chip() {
  return (
    <FieldTypePicker
      variant="chip"
      label="Column type"
      types={["text", "number", "date", "boolean"]}
      showStorage={false}
      defaultValue="number"
    />
  );
}
