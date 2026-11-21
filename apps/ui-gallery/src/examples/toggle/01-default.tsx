import { Toggle } from "@forgeron/ui";

export default function Default() {
  return (
    <div style={{ display: "flex", gap: 12 }}>
      <Toggle aria-label="Toggle bold">Bold</Toggle>
      <Toggle variant="outline" defaultPressed aria-label="Toggle italic">
        Italic
      </Toggle>
      <Toggle size="sm" aria-label="Toggle underline">
        Underline
      </Toggle>
    </div>
  );
}
