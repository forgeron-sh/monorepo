import { ReactionBar, toggleConversationReaction, type ConversationReaction } from "@forgeron/ui";
import { useState } from "react";

const me = { id: "me", name: "You" };

export default function Default() {
  const [reactions, setReactions] = useState<ConversationReaction[]>([
    {
      emoji: "👍",
      users: [{ id: "lea", name: "Léa Martin" }, { id: "karim", name: "Karim Aziz" }, me],
    },
    { emoji: "🎉", users: [{ id: "sam", name: "Sam Roche" }] },
  ]);
  return (
    <ReactionBar
      reactions={reactions}
      currentUserId="me"
      onToggle={(emoji) => setReactions((r) => toggleConversationReaction(r, emoji, me))}
    />
  );
}
