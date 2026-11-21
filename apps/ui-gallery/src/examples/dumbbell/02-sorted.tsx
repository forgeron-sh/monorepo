import { Dumbbell } from "@forgeron/ui";

// Biggest moves first: adoption of each tool, the month before and after the rollout.
export default function Sorted() {
  return (
    <div style={{ width: "100%", maxWidth: 560 }}>
      <Dumbbell
        title="Weekly active users per tool"
        fromLabel="Before rollout"
        toLabel="After"
        sort="change"
        zero
        items={[
          { label: "Notes", from: 42, to: 118 },
          { label: "Timesheets", from: 96, to: 104 },
          { label: "Expenses", from: 31, to: 77 },
          { label: "Leave", from: 58, to: 51 },
        ]}
      />
    </div>
  );
}
