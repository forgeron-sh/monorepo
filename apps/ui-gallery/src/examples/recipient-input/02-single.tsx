import { RecipientInput } from "@forgeron/ui";
import { useState } from "react";

export default function Single() {
  const [to, setTo] = useState<string[]>([]);
  return (
    <div style={{ width: "100%", maxWidth: 520 }}>
      <RecipientInput
        label="To"
        value={to}
        onChange={setTo}
        placeholder="Paste a list of addresses"
        max={5}
      />
      <p style={{ font: "12px var(--font-mono)", color: "var(--ink-muted)" }}>{to.length} / 5</p>
    </div>
  );
}
