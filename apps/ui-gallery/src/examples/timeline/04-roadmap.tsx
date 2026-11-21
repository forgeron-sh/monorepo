// A roadmap by quarters, with the zoom and Today held outside the block (a display menu, a
// toolbar of your own) through `zoom` and the `scrollToToday` handle.
import { Button, Segmented, Timeline, type TimelineHandle, type TimelineZoom } from "@forgeron/ui";
import { useRef, useState } from "react";

const initiatives = [
  {
    id: "eu",
    name: "Second warehouse",
    color: "var(--accent)",
    start: "2026-07-01",
    end: "2027-03-31",
  },
  {
    id: "books",
    name: "Books in Odoo",
    color: "var(--success)",
    start: "2026-09-14",
    end: "2026-12-31",
  },
  {
    id: "fleet",
    name: "Electric fleet",
    color: "var(--warning)",
    start: "2027-01-04",
    end: "2027-06-30",
  },
  { id: "iso", name: "ISO 9001 audit", end: "2027-02-15" },
];

export default function Roadmap() {
  const [zoom, setZoom] = useState<TimelineZoom>("quarters");
  const timeline = useRef<TimelineHandle>(null);
  return (
    <div style={{ width: "100%", display: "grid", gap: 8 }}>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <Button size="sm" onClick={() => timeline.current?.scrollToToday()}>
          Today
        </Button>
        <Segmented
          label="Zoom"
          value={zoom}
          onChange={(z) => setZoom(z as TimelineZoom)}
          options={[
            { value: "months", label: "Months" },
            { value: "quarters", label: "Quarters" },
          ]}
        />
      </div>
      <div style={{ height: 220, display: "flex", border: "1px solid var(--line)" }}>
        <Timeline
          ref={timeline}
          records={initiatives}
          zoom={zoom}
          onZoomChange={setZoom}
          weekNumbers
          today="2026-11-18"
          toolbar={false}
        />
      </div>
    </div>
  );
}
