import { DivergingBar } from "@forgeron/ui";

// A score around neutral, sorted: what users said of each feature (promoters minus detractors).
export default function Sorted() {
  return (
    <div style={{ width: 460 }}>
      <DivergingBar
        title="Feature sentiment"
        sides={["Detractors", "Promoters"]}
        sorted
        items={[
          { label: "Search", value: 34 },
          { label: "Exports", value: -18 },
          { label: "Mobile", value: -7 },
          { label: "Approvals", value: 22 },
          { label: "Reports", value: 9 },
        ]}
      />
    </div>
  );
}
