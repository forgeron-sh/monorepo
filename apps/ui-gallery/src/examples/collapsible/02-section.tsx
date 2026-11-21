import { Collapsible } from "@forgeron/ui";

export default function Section() {
  return (
    <div style={{ width: "min(100%, 420px)" }}>
      <Collapsible title="Advanced options" hint="3">
        Retries, timeouts and the region the tool runs in.
      </Collapsible>
    </div>
  );
}
