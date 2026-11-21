// Every part of the editor in the order of your choice: the sentence first, the next dates last.
import {
  RecurrenceEditor,
  RecurrenceEditorDays,
  RecurrenceEditorEnd,
  RecurrenceEditorEvery,
  RecurrenceEditorNext,
  RecurrenceEditorSummary,
  RecurrenceEditorToggle,
} from "@forgeron/ui";

export default function Composed() {
  return (
    <RecurrenceEditor
      start="2026-11-18"
      defaultValue={{ frequency: "weekly", interval: 1, end: { kind: "never" } }}
    >
      <RecurrenceEditorToggle label="Repeats" />
      <RecurrenceEditorSummary />
      <RecurrenceEditorEvery />
      <RecurrenceEditorDays />
      <RecurrenceEditorEnd />
      <RecurrenceEditorNext />
    </RecurrenceEditor>
  );
}
