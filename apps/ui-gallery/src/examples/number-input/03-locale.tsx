import { NumberInput } from "@forgeron/ui";

export default function Locale() {
  return (
    <div style={{ display: "grid", gap: 8 }}>
      <NumberInput
        label="Weight, French"
        locale="fr-FR"
        suffix="kg"
        step={0.5}
        defaultValue={1234.5}
      />
      <NumberInput
        label="Weight, English"
        locale="en-US"
        suffix="kg"
        step={0.5}
        defaultValue={1234.5}
      />
      <NumberInput
        label="Discount"
        format={{ style: "percent" }}
        step={0.05}
        min={0}
        max={1}
        defaultValue={0.15}
      />
    </div>
  );
}
