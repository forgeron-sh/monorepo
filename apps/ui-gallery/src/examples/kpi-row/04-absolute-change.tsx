import { KpiRow } from "@forgeron/ui";

// A change that is not a ratio: formatDelta writes it.
export default function AbsoluteChange() {
  return (
    <div style={{ width: "100%", maxWidth: 560 }}>
      <KpiRow
        formatDelta={(d) => `${d > 0 ? "+" : d < 0 ? "−" : "±"}${Math.abs(d)}`}
        items={[
          { label: "Deploys", value: "64", delta: 12, hint: "this week" },
          { label: "Failed runs", value: "3", delta: 2, better: "down", hint: "this week" },
          { label: "Tools", value: "21", delta: 0, hint: "installed" },
        ]}
      />
    </div>
  );
}
