import { Delete02Icon, Share08Icon } from "@forgeron/icons";
import {
  SelectionBarActions,
  SelectionBarClear,
  SelectionBarCount,
  SelectionBarRoot,
  SelectionBarSeparator,
  type Action,
} from "@forgeron/ui";
import { useState } from "react";

export default function Default() {
  const [count, setCount] = useState(3);
  const actions: Action[] = [
    { id: "share", label: "Share", icon: Share08Icon, run: () => {} },
    { id: "remove", label: "Delete", icon: Delete02Icon, danger: true, run: () => setCount(0) },
  ];
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <SelectionBarRoot count={count} onClear={() => setCount(0)}>
        <SelectionBarClear />
        <SelectionBarCount />
        <SelectionBarSeparator />
        <SelectionBarActions actions={actions} />
      </SelectionBarRoot>
      <small>
        {count === 0 ? "Nothing selected: the bar is gone. " : `${count} selected. `}
        <button type="button" onClick={() => setCount(count + 1)}>
          Select one more
        </button>
      </small>
    </div>
  );
}
