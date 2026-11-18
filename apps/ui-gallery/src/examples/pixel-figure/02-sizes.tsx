import { PixelFigure } from "@forgeron/ui";

// A name, a price, a figure, a step.
export default function Sizes() {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 24 }}>
      <PixelFigure text="Cloud" size="sm" tone="ink" />
      <PixelFigure text="$14.99" size="md" tone="ink" />
      <PixelFigure text="13K+" size="lg" />
      <PixelFigure text="01" label="Step 1" size="xl" />
    </div>
  );
}
