import { Activity, Button, PriorityGlyph, StatusGlyph, type ActivityItem } from "@forgeron/ui";
import { useState } from "react";

const start: ActivityItem[] = [
  { kind: "event", id: "e1", author: "Camille Roy", text: "created the issue", time: "3 Nov" },
  {
    kind: "event",
    id: "e2",
    author: "Camille Roy",
    text: "set the priority to Urgent",
    time: "3 Nov",
    glyph: <PriorityGlyph level={1} />,
  },
  {
    kind: "event",
    id: "e3",
    author: "Camille Roy",
    text: "assigned it to Hugo Bernard",
    time: "4 Nov",
  },
  {
    kind: "comment",
    id: "c1",
    author: "Hugo Bernard",
    body: "Odoo sends the webhook twice when an invoice is validated, then posted. I dedupe on the move id now; the fix is in review.",
    time: "3 h ago",
    dateTime: "2026-11-17T09:10",
  },
  {
    kind: "event",
    id: "e4",
    author: "Hugo Bernard",
    text: "moved it to In Review",
    time: "2 h ago",
    glyph: <StatusGlyph status="review" />,
  },
  {
    kind: "comment",
    id: "c2",
    author: "Nadia Petit",
    body: "Thanks. Two suppliers called about it this morning.",
    time: "1 h ago",
    dateTime: "2026-11-17T11:02",
  },
];

export default function Thread() {
  const [items, setItems] = useState(start);
  const [subscribed, setSubscribed] = useState(true);
  return (
    <div style={{ width: "100%", maxWidth: 640 }}>
      <Activity
        items={items}
        actions={
          <Button variant="ghost" size="sm" onClick={() => setSubscribed((s) => !s)}>
            {subscribed ? "Unsubscribe" : "Subscribe"}
          </Button>
        }
        onSubmit={(text) =>
          setItems((list) => [
            ...list,
            {
              kind: "comment",
              id: `c${list.length + 1}`,
              author: "Camille Roy",
              body: text,
              time: "just now",
            },
          ])
        }
      />
    </div>
  );
}
