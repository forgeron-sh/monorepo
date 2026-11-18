// Keys bound while the component is shown; ignored while typing in a field. Try J, K, ⇧R, then
// type in the field.
import { Input, Kbd, formatShortcut, useShortcuts } from "@forgeron/ui";
import { useState } from "react";

const KEYS = ["j", "k", "shift+r"];

export default function Keys() {
  const [last, setLast] = useState("Press a key");
  useShortcuts(Object.fromEntries(KEYS.map((k) => [k, () => setLast(`Ran ${k}`)])));
  return (
    <div style={{ display: "grid", gap: 12, justifyItems: "start" }}>
      <div style={{ display: "flex", gap: 8 }}>
        {KEYS.map((k) => (
          <Kbd key={k} keys={formatShortcut(k)} />
        ))}
      </div>
      <Input aria-label="Type here" placeholder="Typing here runs nothing" />
      <code className="t-mono" style={{ color: "var(--ink-muted)", fontSize: 12 }}>
        {last}
      </code>
    </div>
  );
}
