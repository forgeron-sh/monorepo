import { StatusStrip } from "@forgeron/ui";

const runs = "ok ok ok ok degraded ok ok ok ok ok down ok ok ok ok ok ok ok ok none none ok ok ok"
  .split(" ")
  .map((status, i) => ({
    label: `Run ${461 + i}`,
    status: status as "ok" | "degraded" | "down" | "none",
    ...(status === "down" ? { note: "Step 3 failed: timeout" } : {}),
    ...(status === "degraded" ? { note: "Passed after a retry" } : {}),
  }));

// The same strip for runs of an automation, with its own words for the states.
export default function Runs() {
  return (
    <div style={{ width: 420 }}>
      <StatusStrip
        title="Nightly sync, last 24 runs"
        height={24}
        items={runs}
        labels={{ ok: "Passed", degraded: "Retried", down: "Failed", none: "Skipped" }}
      />
    </div>
  );
}
