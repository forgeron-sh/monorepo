import { DropZone } from "@forgeron/ui";
import { useState } from "react";

export default function Default() {
  const [names, setNames] = useState<string[]>([]);
  return (
    <div style={{ display: "grid", gap: 8, width: "100%", maxWidth: 420 }}>
      <DropZone
        onFiles={(files) => setNames(files.map((f) => f.name))}
        description="PDF, images and sheets, up to 100 MB each."
      />
      {names.length ? (
        <span style={{ color: "var(--ink-dim)", font: "400 11px/16px var(--font-mono)" }}>
          {names.join(", ")}
        </span>
      ) : null}
    </div>
  );
}
