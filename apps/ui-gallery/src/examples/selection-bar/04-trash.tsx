// In the trash the selection offers other actions: restore, or delete for good.
import { Delete02Icon, Undo02Icon } from "@forgeron/icons";
import { Button, SelectionBar } from "@forgeron/ui";
import { useState } from "react";

export default function Trash() {
  const [count, setCount] = useState(2);
  const [said, setSaid] = useState("");
  return (
    <div style={{ display: "grid", gap: 8, width: "100%", maxWidth: 520 }}>
      <SelectionBar
        count={count}
        onClear={() => setCount(0)}
        actions={[
          { id: "restore", label: "Restore", icon: Undo02Icon, run: () => setSaid("Restored") },
          {
            id: "purge",
            label: "Delete forever",
            icon: Delete02Icon,
            danger: true,
            run: () => setSaid("Deleted forever"),
          },
        ]}
      />
      {count === 0 ? (
        <Button size="sm" onClick={() => setCount(2)}>
          Select 2 items
        </Button>
      ) : null}
      <span style={{ color: "var(--ink-dim)", font: "400 11px/16px var(--font-mono)" }}>
        {said}
      </span>
    </div>
  );
}
