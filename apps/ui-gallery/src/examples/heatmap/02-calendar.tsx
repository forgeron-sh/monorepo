import { Heatmap } from "@forgeron/ui";

/** A day `offset` days from 2026-11-18, as YYYY-MM-DD. */
const day = (offset: number) => {
  const d = new Date(2026, 10, 18 + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export default function Calendar() {
  return (
    <Heatmap
      title="Commits, last 20 weeks"
      from={day(-139)}
      to={day(0)}
      items={Array.from({ length: 140 }, (_, i) => ({
        date: day(i - 139),
        value: Math.max(0, Math.round(Math.sin(i / 3) * 5 + ((i * 7) % 6) - 1)),
      }))}
      cell={12}
      unit="commits"
    />
  );
}
