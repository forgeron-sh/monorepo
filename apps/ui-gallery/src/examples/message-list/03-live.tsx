import { Button, MessageList, TypingIndicator, type ConversationMessage } from "@forgeron/ui";
import { useState } from "react";

const lea = { id: "lea", name: "Léa Martin" };
const seed = Array.from({ length: 24 }, (_, i): ConversationMessage => ({
  id: `m${i}`,
  at: new Date(Date.UTC(2026, 10, 19, 8, i * 7)).toISOString(),
  author: i % 3 === 0 ? lea : { id: "karim", name: "Karim Aziz" },
  body: `Message ${i + 1}: scroll up, then receive one.`,
}));

export default function Live() {
  const [messages, setMessages] = useState(seed);
  const [older, setOlder] = useState(0);
  return (
    <div style={{ width: "100%", maxWidth: 680 }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <Button
          size="sm"
          onClick={() =>
            setMessages((all) => [
              ...all,
              {
                id: `n${all.length}`,
                at: new Date().toISOString(),
                author: lea,
                body: "A new message arrives.",
              },
            ])
          }
        >
          Receive a message
        </Button>
        <Button
          size="sm"
          onClick={() => {
            setOlder((n) => n + 1);
            setMessages((all) => [
              {
                id: `old${older}`,
                at: new Date(Date.UTC(2026, 10, 18, 9, older)).toISOString(),
                author: lea,
                body: `An older message ${older + 1}, added on top.`,
              },
              ...all,
            ]);
          }}
        >
          Load an older one
        </Button>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: 360,
          border: "1px solid var(--line-strong)",
        }}
      >
        <MessageList
          messages={messages}
          currentUserId="me"
          now="2026-11-19T12:00:00Z"
          timeZone="UTC"
        />
        <TypingIndicator names={["Karim"]} />
      </div>
    </div>
  );
}
