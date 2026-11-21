import { StrokePicker } from "@forgeron/ui";

export default function Fields() {
  return (
    <div style={{ width: "100%", maxWidth: 320 }}>
      <StrokePicker label="Outline" fields={["color", "width"]} preview={false} />
    </div>
  );
}
