import {
  TrashList,
  TrashListBar,
  TrashListEmpty,
  TrashListNotice,
  TrashListRows,
  useTrashList,
  type TrashEntry,
} from "@forgeron/ui";
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
];

function Body() {
  const { rows } = useTrashList();
  return rows.length === 0 ? <TrashListEmpty /> : <TrashListRows />;
}

export default function Composed() {
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
      >
        <TrashListNotice />
        <TrashListBar />
        <Body />
      </TrashList>
    </div>
  );
}
