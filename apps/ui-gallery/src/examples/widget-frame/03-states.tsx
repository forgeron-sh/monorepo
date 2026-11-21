import { Segmented, WidgetFrame } from "@forgeron/ui";
import { useState } from "react";

type State = "ready" | "loading" | "error" | "empty";

export default function States() {
  const [state, setState] = useState<State>("loading");
  return (
    <div
      style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", maxWidth: 440 }}
    >
      <Segmented
        label="State"
        value={state}
        onChange={(next) => setState(next as State)}
        options={(["ready", "loading", "error", "empty"] as const).map((s) => ({
          value: s,
          label: s,
        }))}
      />
      <div style={{ height: 220 }}>
        <WidgetFrame
          title="Open tickets"
          subtitle="By team"
          loading={state === "loading"}
          error={state === "error" ? "The ticket service did not answer." : undefined}
          onRetry={() => setState("loading")}
          empty={state === "empty"}
        >
          <p style={{ margin: 0 }}>37 open, 12 waiting for a customer.</p>
        </WidgetFrame>
      </div>
    </div>
  );
}
