import { Waffle } from "@forgeron/ui";

// One share against the rest: 20 squares of 5% read faster than a ring.
export default function OneShare() {
  return (
    <div style={{ width: 360 }}>
      <Waffle
        title="Tools with an owner"
        cells={20}
        columns={10}
        cell={18}
        items={[
          { label: "Owned", value: 34 },
          { label: "No owner", value: 9 },
        ]}
      />
    </div>
  );
}
