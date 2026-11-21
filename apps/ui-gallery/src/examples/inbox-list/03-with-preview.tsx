import { AlarmClockIcon, InboxIcon, TickDouble01Icon } from "@forgeron/icons";
import { EmptyState, IconButton, InboxList, type InboxItem } from "@forgeron/ui";
import { useState } from "react";

const start: InboxItem[] = [
  {
    id: "n1",
    reference: "OPS-40",
    title: "Supplier invoices arrive twice from Odoo",
    preview: "Hugo Bernard commented: “Odoo sends the webhook twice when the invoice is posted.”",
    time: "2h",
    dateTime: "2026-11-17T08:00",
    unread: true,
    person: "Hugo Bernard",
  },
  {
    id: "n2",
    reference: "OPS-31",
    title: "Supplier portal: sign-in with an expired invite",
    preview: "Léa Martin mentioned you",
    time: "4h",
    dateTime: "2026-11-17T06:00",
    unread: true,
    person: "Léa Martin",
  },
  {
    id: "n3",
    reference: "OPS-22",
    title: "Fire exit signage audit",
    preview: "Overdue since yesterday",
    time: "9h",
    dateTime: "2026-11-17T01:00",
    unread: true,
    icon: AlarmClockIcon,
  },
  {
    id: "n4",
    reference: "OPS-34",
    title: "Carrier rates: import the new grid",
    preview: "Nadia Petit moved it to In Review",
    time: "1d",
    dateTime: "2026-11-16T10:00",
    person: "Nadia Petit",
  },
];

export default function WithPreview() {
  const [items, setItems] = useState(start);
  const [selected, setSelected] = useState<string | null>(null);
  const open = items.find((i) => i.id === selected);
  const select = (id: string) => {
    setSelected(id);
    setItems((list) => list.map((i) => (i.id === id ? { ...i, unread: false } : i)));
  };
  return (
    <div
      style={{
        width: "100%",
        display: "grid",
        gridTemplateColumns: "320px minmax(0, 1fr)",
        height: 300,
        border: "1px solid var(--line-strong)",
        background: "var(--bg)",
      }}
    >
      <div style={{ borderRight: "1px solid var(--line)", overflow: "auto" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: 44,
            padding: "0 8px 0 14px",
            borderBottom: "1px solid var(--line)",
          }}
        >
          <b>Inbox</b>
          <IconButton
            icon={TickDouble01Icon}
            label="Mark all as read"
            size="sm"
            onClick={() => setItems((list) => list.map((i) => ({ ...i, unread: false })))}
          />
        </div>
        <InboxList items={items} selectedId={selected} onSelect={select} label="Inbox" />
      </div>
      {open ? (
        <div style={{ padding: "24px 28px" }}>
          <div style={{ color: "var(--ink-dim)", font: "400 11.5px/16px var(--font-mono)" }}>
            {open.reference}
          </div>
          <h3 style={{ margin: "4px 0 12px", font: "600 18px/26px var(--font-sans)" }}>
            {open.title}
          </h3>
          <p style={{ margin: 0, color: "var(--ink-muted)" }}>{open.preview}</p>
        </div>
      ) : (
        <EmptyState icon={InboxIcon} title="No notification selected" variant="hatch" />
      )}
    </div>
  );
}
