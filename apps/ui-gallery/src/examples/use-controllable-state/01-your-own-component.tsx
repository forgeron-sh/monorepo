// The pattern every component of the library follows, for your own: controlled with `value`,
// on its own with `defaultValue`, `onChange` either way.
import { Button, useControllableState } from "@forgeron/ui";
import { useState } from "react";

function Stepper(props: { value?: number; defaultValue?: number; onChange?: (n: number) => void }) {
  const [n, setN] = useControllableState({
    value: props.value,
    defaultValue: props.defaultValue ?? 0,
    onChange: props.onChange,
  });
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <Button size="sm" onClick={() => setN((c) => c - 1)}>
        −
      </Button>
      <span className="t-mono" style={{ minWidth: 24, textAlign: "center" }}>
        {n}
      </span>
      <Button size="sm" onClick={() => setN((c) => c + 1)}>
        +
      </Button>
    </div>
  );
}

export default function YourOwnComponent() {
  const [owned, setOwned] = useState(10);
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <Stepper defaultValue={3} />
      <Stepper value={owned} onChange={(n) => setOwned(Math.min(n, 12))} />
    </div>
  );
}
