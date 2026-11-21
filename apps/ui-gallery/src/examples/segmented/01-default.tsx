import { Segmented, SegmentedItem } from "@forgeron/ui";
import { useState } from "react";

export default function Composed() {
  const [range, setRange] = useState("week");
  return (
    <Segmented label="Range" value={range} onChange={setRange}>
      <SegmentedItem value="day">Day</SegmentedItem>
      <SegmentedItem value="week">Week</SegmentedItem>
      <SegmentedItem value="month">Month</SegmentedItem>
    </Segmented>
  );
}
