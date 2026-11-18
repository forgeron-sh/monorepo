import { Activity, CommentComposer, type ActivityItem } from "@forgeron/ui";
import { useState } from "react";

const items: ActivityItem[] = [
  {
    kind: "comment",
    id: "c2",
    author: "Nadia Petit",
    body: "Thanks. Two suppliers called about it this morning.",
    quote: { author: "Hugo Bernard", text: "I dedupe on the move id now; the fix is in review." },
    time: "1 h ago",
    highlighted: true,
  },
];

export default function Reply() {
  const [draft, setDraft] = useState("");
  const [sent, setSent] = useState<string | null>(null);
  return (
    <div style={{ width: "100%", maxWidth: 640, display: "grid", gap: 12 }}>
      <Activity title="Mentioned you" items={items} />
      <CommentComposer
        label="Reply to Nadia Petit"
        placeholder="Reply…"
        submitLabel="Reply"
        value={draft}
        onChange={setDraft}
        onSubmit={(text) => {
          setSent(text);
          setDraft("");
        }}
      />
      {sent ? <p style={{ margin: 0, color: "var(--ink-muted)" }}>Sent: {sent}</p> : null}
    </div>
  );
}
