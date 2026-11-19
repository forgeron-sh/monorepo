import { ConversationList, type ConversationListItem } from "@forgeron/ui";
import { useState } from "react";

const items: ConversationListItem[] = [
  {
    id: "1",
    title: "# general",
    section: "channels",
    preview: "Standup in 5",
    at: "2026-11-19T09:55:00Z",
    unread: 1,
  },
  {
    id: "2",
    title: "# ops",
    section: "channels",
    preview: "Deploy done",
    at: "2026-11-19T07:00:00Z",
    pinned: true,
  },
  {
    id: "3",
    title: "Léa Martin",
    section: "direct",
    people: ["Léa Martin"],
    presence: "busy",
    preview: "Back at 14:00",
    at: "2026-11-18T12:00:00Z",
  },
  {
    id: "4",
    title: "Sam Roche",
    section: "direct",
    people: ["Sam Roche"],
    presence: "offline",
    preview: "Thanks!",
    at: "2026-11-10T12:00:00Z",
  },
];

export default function Sections() {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <div style={{ width: "100%", maxWidth: 380, border: "1px solid var(--line-strong)" }}>
      <ConversationList
        items={items}
        selectedId={selected}
        onSelect={setSelected}
        sections={[
          { id: "channels", label: "Channels" },
          { id: "direct", label: "Direct messages" },
        ]}
        now="2026-11-19T12:00:00Z"
        timeZone="UTC"
      />
    </div>
  );
}
