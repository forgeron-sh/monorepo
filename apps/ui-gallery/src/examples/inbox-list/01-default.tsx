import {
  InboxList,
  InboxListPreview,
  InboxListRow,
  InboxListTime,
  InboxListTitle,
  InboxListWho,
  type InboxItem,
} from "@forgeron/ui";
import { useState } from "react";

const items: InboxItem[] = [
  {
    id: "n1",
    reference: "OPS-40",
    title: "Supplier invoices arrive twice from Odoo",
    preview: "Hugo Bernard commented: “Odoo sends the webhook twice…”",
    time: "2h",
    unread: true,
    person: "Hugo Bernard",
  },
  {
    id: "n2",
    reference: "OPS-31",
    title: "Supplier portal: sign-in with an expired invite",
    preview: "Léa Martin mentioned you",
    time: "4h",
    person: "Léa Martin",
  },
];

export default function Composed() {
  const [selected, setSelected] = useState("n1");
  return (
    <div style={{ width: 300, borderTop: "1px solid var(--line)" }}>
      <InboxList items={items} selectedId={selected} onSelect={setSelected}>
        {items.map((item) => (
          <InboxListRow key={item.id} id={item.id} unread={Boolean(item.unread)}>
            <InboxListWho {...(item.person ? { person: item.person } : {})} />
            <InboxListTitle {...(item.reference ? { reference: item.reference } : {})}>
              {item.title}
            </InboxListTitle>
            <InboxListTime unread={Boolean(item.unread)}>{item.time}</InboxListTime>
            <InboxListPreview>{item.preview}</InboxListPreview>
          </InboxListRow>
        ))}
      </InboxList>
    </div>
  );
}
