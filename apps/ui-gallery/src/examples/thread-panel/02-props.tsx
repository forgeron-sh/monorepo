import { ThreadPanel, type ConversationMessage } from "@forgeron/ui";
import { useState } from "react";

const lea = { id: "lea", name: "Léa Martin" };
const me = { id: "me", name: "You" };

const root: ConversationMessage = {
  id: "r",
  at: "2026-11-19T08:55:00Z",
  author: lea,
  body: "Found it: the **webhook** is sent twice. Thoughts?",
};

export default function Default() {
  const [replies, setReplies] = useState<ConversationMessage[]>([
    {
      id: "1",
      at: "2026-11-19T09:02:00Z",
      author: me,
      body: "Add an idempotency key on our side.",
    },
    { id: "2", at: "2026-11-19T09:10:00Z", author: lea, body: "Agreed, I will open a PR." },
  ]);
  return (
    <div
      style={{ height: 520, width: "100%", maxWidth: 420, border: "1px solid var(--line-strong)" }}
    >
      <ThreadPanel
        root={root}
        replies={replies}
        currentUserId="me"
        typing={["Léa"]}
        list={{ now: "2026-11-19T12:00:00Z" }}
        timeZone="UTC"
        onClose={() => {}}
        onSend={({ text }) =>
          setReplies((r) => [
            ...r,
            { id: `n${r.length}`, at: new Date().toISOString(), author: me, body: text },
          ])
        }
        onReact={() => {}}
      />
    </div>
  );
}
