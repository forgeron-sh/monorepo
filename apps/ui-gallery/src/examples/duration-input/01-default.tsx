import {
  DurationInput,
  DurationInputHours,
  DurationInputMinutes,
  DurationInputPreset,
  DurationInputPresets,
  DurationInputRow,
} from "@forgeron/ui";

// The parts, placed as you like: here only two presets and a different line of words.
export default function Composed() {
  return (
    <DurationInput aria-label="Meeting length" defaultValue={45}>
      <DurationInputRow>
        <DurationInputHours label="Meeting length, hours" />
        <DurationInputMinutes label="Meeting length, minutes" />
      </DurationInputRow>
      <DurationInputPresets aria-label="Meeting length, usual lengths">
        <DurationInputPreset minutes={30} />
        <DurationInputPreset minutes={60}>1 hour</DurationInputPreset>
      </DurationInputPresets>
    </DurationInput>
  );
}
