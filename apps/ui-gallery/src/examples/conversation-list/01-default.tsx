import {
  ConversationList,
  ConversationListCount,
  ConversationListGroups,
  ConversationListPreview,
  ConversationListRow,
  ConversationListTime,
  ConversationListTitle,
  ConversationListWho,
  type ConversationListItem,
} from "@forgeron/ui";
import { useState } from "react";

const items: ConversationListItem[] = [
  {
    id: "1",
    title: "Léa Martin",
    people: ["Léa Martin"],
    presence: "online",
    preview: "Can you review the PR?",
    at: "2026-11-19T09:41:00Z",
    unread: 2,
    pinned: true,
  },
  {
    id: "2",
    title: "Design",
    people: ["Sam Roche", "Jo Bernard", "Karim Aziz"],
    preview: "New icons are in",
    previewAuthor: "Sam",
    at: "2026-11-19T08:10:00Z",
    unread: 14,
    mention: true,
  },
  {
    id: "3",
    title: "Karim Aziz",
    people: ["Karim Aziz"],
    presence: "away",
    typing: true,
    at: "2026-11-18T17:00:00Z",
  },
];

export default function Composed() {
  const [selected, setSelected] = useState<string | null>("1");
  return (
    <div style={{ width: "100%", maxWidth: 380, border: "1px solid var(--line-strong)" }}>
      <ConversationList
        items={items}
        selectedId={selected}
        onSelect={setSelected}
        now="2026-11-19T12:00:00Z"
        timeZone="UTC"
      >
        <ConversationListGroups
          renderRow={(item) => (
            <ConversationListRow item={item}>
              <ConversationListWho />
              <ConversationListTitle />
              <ConversationListTime />
              <ConversationListPreview />
              <ConversationListCount />
            </ConversationListRow>
          )}
        />
      </ConversationList>
    </div>
  );
}
