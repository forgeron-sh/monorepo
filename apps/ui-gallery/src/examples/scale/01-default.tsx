import { Scale, ScaleEnds, ScaleItem, ScaleLabel, ScaleRow } from "@forgeron/ui";

// The parts: Scale without a label is the root; the row holds one item per number.
export default function Composed() {
  return (
    <Scale min={1} max={5} defaultValue={4}>
      <ScaleLabel>How satisfied are you?</ScaleLabel>
      <ScaleRow label="How satisfied are you?">
        {[1, 2, 3, 4, 5].map((n) => (
          <ScaleItem key={n} value={n} />
        ))}
      </ScaleRow>
      <ScaleEnds>
        <span>Not at all</span>
        <span>Very</span>
      </ScaleEnds>
    </Scale>
  );
}
