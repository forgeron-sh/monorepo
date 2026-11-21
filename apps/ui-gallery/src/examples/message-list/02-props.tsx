import {
  MessageList,
  RichComposer,
  toggleConversationReaction,
  type ConversationMessage,
} from "@forgeron/ui";
import { useState } from "react";

const lea = { id: "lea", name: "Léa Martin" };
const karim = { id: "karim", name: "Karim Aziz" };
const me = { id: "me", name: "You" };

const start: ConversationMessage[] = [
  {
    id: "1",
    at: "2026-11-18T16:40:00Z",
    author: karim,
    body: "The export job failed twice last night.",
  },
  {
    id: "2",
    at: "2026-11-18T16:41:00Z",
    author: karim,
    body: "Logs are in #[OPS-40](ops-40), look for `timeout`.",
  },
  {
    id: "3",
    at: "2026-11-19T08:55:00Z",
    author: lea,
    body: "Found it: the **webhook** is sent twice. I will add an idempotency key.",
    reactions: [{ emoji: "👍", users: [karim] }],
    replyCount: 2,
    lastReplyAt: "2026-11-19T09:10:00Z",
  },
  {
    id: "4",
    at: "2026-11-19T09:02:00Z",
    author: me,
    body: "Great, ship it before noon?",
    edited: true,
  },
  { id: "5", at: "2026-11-19T09:20:00Z", kind: "system", body: "Karim joined the channel" },
  {
    id: "6",
    at: "2026-11-19T09:22:00Z",
    author: karim,
    body: "On it. Review welcome.",
    replyTo: { id: "3", author: "Léa Martin", text: "Found it: the webhook is sent twice." },
  },
];

export default function Default() {
  const [messages, setMessages] = useState(start);
  const react = (id: string, emoji: string) =>
    setMessages((all) =>
      all.map((m) =>
        m.id === id
          ? { ...m, reactions: toggleConversationReaction(m.reactions ?? [], emoji, me) }
          : m,
      ),
    );
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: 460,
        width: "100%",
        maxWidth: 680,
        border: "1px solid var(--line-strong)",
      }}
    >
      <MessageList
        messages={messages}
        currentUserId="me"
        unreadFromId="6"
        now="2026-11-19T12:00:00Z"
        timeZone="UTC"
        onReact={react}
        onReply={() => {}}
        onOpenThread={() => {}}
        onEdit={() => {}}
        onDelete={(m) =>
          setMessages((all) => all.map((x) => (x.id === m.id ? { ...x, deleted: true } : x)))
        }
      />
      <RichComposer
        placeholder="Write to #ops…"
        onSend={({ text }) =>
          setMessages((all) => [
            ...all,
            { id: `n${all.length}`, at: new Date().toISOString(), author: me, body: text },
          ])
        }
      />
    </div>
  );
}
