import { Textarea } from "@forgeron/ui";

export default function TextareaExample() {
  return (
    <div style={{ width: 320 }}>
      <Textarea placeholder="Add a note for the team" aria-label="Note" />
    </div>
  );
}
