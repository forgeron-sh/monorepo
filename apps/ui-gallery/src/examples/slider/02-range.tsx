import { Slider } from "@forgeron/ui";

export default function Range() {
  return (
    <Slider
      label="Price"
      showValue
      min={0}
      max={500}
      step={10}
      minGap={1}
      defaultValue={[80, 320]}
      formatValue={(n) => `€${n}`}
      marks={[0, 100, 200, 300, 400, 500]}
    />
  );
}
