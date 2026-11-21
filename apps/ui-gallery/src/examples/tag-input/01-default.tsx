import { TagInput, TagInputField, TagInputList, TagInputTags } from "@forgeron/ui";

// The parts: TagInput without a label is the root; the list holds the tags and the field.
export default function Composed() {
  return (
    <TagInput defaultValue={["design", "ui"]} max={5}>
      <TagInputList aria-label="Topics, added">
        <TagInputTags />
        <TagInputField aria-label="Topics" placeholder="Add a topic" />
      </TagInputList>
    </TagInput>
  );
}
