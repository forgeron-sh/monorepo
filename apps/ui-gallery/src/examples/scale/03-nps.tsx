import { Scale } from "@forgeron/ui";

export default function Nps() {
  return (
    <Scale
      nps
      label="How likely are you to recommend us to a colleague?"
      lowLabel="Not likely"
      highLabel="Very likely"
      defaultValue={9}
    />
  );
}
