import {
  Sortable,
  SortableDropIndicator,
  SortableHandle,
  SortableItem,
  type SortableMove,
} from "@forgeron/ui";
import { useState } from "react";

const steps = [
  { id: "draft", label: "Draft" },
  { id: "review", label: "Review" },
  { id: "approve", label: "Approve" },
  { id: "publish", label: "Publish" },
];

export default function HandleAndIndicator() {
  const [items, setItems] = useState(steps);
  const [last, setLast] = useState("Drag a grip, or focus a step and press Alt + Up or Down.");
  return (
    <div style={{ display: "grid", gap: 12, width: 280 }}>
      <Sortable
        label="Steps"
        handle
        items={items}
        getLabel={(step) => step.label}
        onReorder={(next, move: SortableMove) => {
          setItems(next);
          setLast(`${move.id}: ${move.from + 1} to ${move.to + 1}`);
        }}
      >
        {(step) => (
          <SortableItem key={step.id} id={step.id}>
            <SortableHandle />
            {step.label}
            <SortableDropIndicator />
          </SortableItem>
        )}
      </Sortable>
      <small>{last}</small>
    </div>
  );
}
