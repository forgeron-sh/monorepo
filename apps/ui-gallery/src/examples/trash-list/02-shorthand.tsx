import { TrashList, type TrashEntry } from "@forgeron/ui";
import { useState } from "react";

const initial: TrashEntry[] = [
  {
    id: "a",
    name: "Invoice 214",
    kind: "Invoice",
    deletedBy: "Ada Lovelace",
    deletedAt: "2026-11-18",
  },
  {
    id: "b",
    name: "Q3 planning",
    kind: "Document",
    deletedBy: "Sam Roche",
    deletedAt: "2026-11-02",
  },
  {
    id: "c",
    name: "Old onboarding checklist",
    kind: "Document",
    deletedBy: "Léa Martin",
    deletedAt: "2026-10-22",
  },
  {
    id: "d",
    name: "Acme renewal",
    kind: "Project",
    deletedBy: "Ada Lovelace",
    deletedAt: "2026-11-17",
  },
];

export default function Default() {
  const [items, setItems] = useState(initial);
  const drop = (ids: string[]) => setItems(items.filter((i) => !ids.includes(i.id)));
  return (
    <div style={{ width: "100%", maxWidth: 760 }}>
      <TrashList
        items={items}
        today="2026-11-19"
        onRestore={drop}
        onDeleteForever={drop}
        onEmpty={() => setItems([])}
      />
    </div>
  );
}
