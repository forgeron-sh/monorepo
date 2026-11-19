import { TagInput } from "@forgeron/ui";

export default function Labels() {
  return (
    <TagInput
      label="Labels"
      placeholder="Add a label, then Enter"
      separators={/[,;\n]+/}
      defaultValue={["good first issue"]}
      max={5}
    />
  );
}
