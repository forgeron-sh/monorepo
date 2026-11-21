import { Activity, StatusGlyph, type ActivityItem } from "@forgeron/ui";

const items: ActivityItem[] = [
  { kind: "event", id: "e1", author: "Camille Roy", text: "created the issue", time: "3 Nov" },
  {
    kind: "event",
    id: "e2",
    author: "Hugo Bernard",
    text: "moved it to In Review",
    time: "2 h ago",
    glyph: <StatusGlyph status="review" />,
  },
  {
    kind: "comment",
    id: "c1",
    author: "Nadia Petit",
    body: "Thanks. Two suppliers called about it this morning.",
    time: "1 h ago",
  },
];

export default function Default() {
  return (
    <div style={{ width: 340 }}>
      <Activity items={items} />
    </div>
  );
}
