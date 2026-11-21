import { Scale } from "@forgeron/ui";

export default function Satisfaction() {
  return (
    <Scale
      label="How satisfied are you?"
      min={1}
      max={5}
      lowLabel="Not at all"
      highLabel="Very"
      defaultValue={4}
    />
  );
}
