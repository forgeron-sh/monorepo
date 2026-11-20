import { Delete02Icon } from "@forgeron/icons";
import {
  SelectionBarActions,
  SelectionBarClear,
  SelectionBarCount,
  SelectionBarRoot,
  SelectionBarSeparator,
  useCollection,
  type Action,
} from "@forgeron/ui";
import { useState } from "react";

const initial = [
  "Invoice 2026-11",
  "Invoice 2026-10",
  "Quote Acme",
  "Quote Globex",
  "Contract Initech",
];

export default function WithCollection() {
  const [items, setItems] = useState(initial);
  const list = useCollection({
    items,
    getId: (name) => name,
    getText: (name) => name,
    selectionMode: "multiple",
  });
  const actions: Action[] = [
    {
      id: "remove",
      label: "Delete",
      icon: Delete02Icon,
      danger: true,
      run: () => {
        setItems(items.filter((name) => !list.isSelected(name)));
        list.clear();
      },
    },
  ];
  return (
    <div style={{ display: "grid", gap: 12, width: 420 }}>
      <SelectionBarRoot count={list.selected.length} onClear={list.clear}>
        <SelectionBarClear />
        <SelectionBarCount />
        <SelectionBarSeparator />
        <SelectionBarActions actions={actions} />
      </SelectionBarRoot>
      <div
        {...list.getContainerProps({
          role: "listbox",
          "aria-label": "Documents",
          "aria-multiselectable": true,
        })}
        style={{ display: "grid", border: "1px solid var(--line-strong)" }}
      >
        {items.map((name) => (
          <div
            key={name}
            {...list.getItemProps(name, { role: "option" })}
            style={{
              padding: "6px 12px",
              cursor: "pointer",
              background: list.isSelected(name) ? "var(--bg-raised)" : undefined,
              outlineOffset: -2,
            }}
          >
            {name}
          </div>
        ))}
      </div>
      <small>
        Click, Cmd/Ctrl click and Shift click select; the arrows move; Cmd/Ctrl A takes all; Escape
        clears; type a letter to jump.
      </small>
    </div>
  );
}
