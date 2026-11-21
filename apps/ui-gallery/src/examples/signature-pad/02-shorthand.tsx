import { SignaturePad, type SignatureValue } from "@forgeron/ui";
import { useState } from "react";

export default function Default() {
  const [value, setValue] = useState<SignatureValue | null>(null);
  return (
    <div style={{ display: "grid", gap: 8, width: "100%", maxWidth: 560 }}>
      <SignaturePad label="Your signature" value={value} onChange={setValue} />
      <span style={{ color: "var(--ink-dim)", font: "400 11px/16px var(--font-mono)" }}>
        {value ? `${value.method} · ${value.dataUrl.slice(0, 30)}…` : "Nothing signed yet"}
      </span>
    </div>
  );
}
