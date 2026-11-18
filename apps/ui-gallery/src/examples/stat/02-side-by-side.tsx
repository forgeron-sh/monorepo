import { Stat } from "@forgeron/ui";

// Tiles on their own, each in its frame. For a row of figures that move, see the KPI row.
export default function SideBySide() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 16 }}>
      <Stat label="Members" value="48" hint="3 invited" />
      <Stat label="Tools" value="21" hint="4 with updates" />
      <Stat label="Storage" value="12.4 GB" hint="of 50 GB" />
    </div>
  );
}
