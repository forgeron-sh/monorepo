import { VersionHistory, type AutomationVersion } from "@forgeron/ui";
import { useState } from "react";

const versions: AutomationVersion[] = [
  {
    version: 2,
    message: "Retry the carrier three times",
    at: "2026-11-12 08:30",
    by: "Hugo Bernard",
    changes: [{ kind: "change", text: "Fetch carrier rates: settings" }],
  },
  {
    version: 1,
    message: "First version",
    at: "2026-11-03 14:12",
    by: "Hugo Bernard",
    changes: [
      { kind: "add", text: "Step “Schedule”" },
      { kind: "add", text: "Step “Fetch carrier rates”" },
      { kind: "add", text: "Step “Post the cheapest”" },
    ],
  },
];

// No draft: the live version is the last one. Restoring an older one makes it the draft.
export default function RestoreAVersion() {
  const [restored, setRestored] = useState<number | null>(null);
  return (
    <div style={{ display: "grid", gap: 12, width: "100%", maxWidth: 720 }}>
      <VersionHistory versions={versions} live={2} defaultSelected={1} onRestore={setRestored} />
      <span className="t-mono dim">
        {restored ? `v${restored} restored as the draft` : "Nothing restored"}
      </span>
    </div>
  );
}
