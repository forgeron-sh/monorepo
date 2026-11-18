import { SectionBand } from "@forgeron/ui";

// The page's column: fg-rail rules both sides; cards take fg-ticks, drawings fg-dots.
export default function OnTheRail() {
  return (
    <div className="fg-rail">
      <div className="fg-ticks" style={{ padding: 24 }}>
        A card with corner brackets
      </div>
      <SectionBand className="fg-rail" from="/0.2" to="/0.3" label="Resources" />
      <div className="fg-dots" style={{ height: 120 }} />
    </div>
  );
}
