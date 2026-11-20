import { useSortable } from "@forgeron/ui";
import { useState } from "react";

const rules = [
  { id: "spam", name: "Mark spam" },
  { id: "label", name: "Label invoices" },
  { id: "forward", name: "Forward to finance" },
];

/** The hook alone: your own elements, the getters spread on them. */
export default function YourOwnRows() {
  const [items, setItems] = useState(rules);
  const sortable = useSortable({
    items,
    getId: (rule) => rule.id,
    getLabel: (rule) => rule.name,
    onReorder: (next) => setItems(next),
    label: "Rules",
    navigate: true,
    orientation: "vertical",
  });
  return (
    <div style={{ width: 280 }}>
      <ol {...sortable.getListProps({ style: { margin: 0, paddingLeft: 20 } })}>
        {items.map((rule) => (
          <li key={rule.id} tabIndex={0} {...sortable.getItemProps(rule.id)}>
            {rule.name}
          </li>
        ))}
      </ol>
      <span role="status" aria-live="polite" className="fg-sr">
        {sortable.status}
      </span>
    </div>
  );
}
