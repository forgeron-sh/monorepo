// Reactions: a toggle per emoji with its count and, on hover or focus, who reacted, then a button
// that opens the EmojiPicker (a primitive, `emoji-picker.tsx`). It stays a block: it speaks of
// messages and reactors.

import { SmilePlusIcon } from "@forgeron/icons";
import { useState } from "react";
import { cx } from "../cx";
import {
  CONVERSATION_EMOJI,
  conversationEmojiName,
  EmojiPicker,
  type EmojiCategory,
} from "../emoji-picker";
import { IconButton } from "../identity";
import { Popover } from "../popover";
import { Tooltip } from "../tooltip";
import { conversationReactionLabel, type ConversationReaction } from "./conversation-model";

export interface ReactionBarProps {
  reactions: ReadonlyArray<ConversationReaction>;
  /** Whose reactions are "yours": pressed, and "You" in the tooltip. */
  currentUserId: string;
  /** Called with the emoji of a chip pressed, or chosen in the picker; the caller adds or removes. */
  onToggle: (emoji: string) => void;
  /** Shows the button that opens the picker. Default `true`. */
  canAdd?: boolean;
  /** Reactions that cannot be pressed. */
  readOnly?: boolean;
  /** Your own emoji set for the picker. */
  categories?: ReadonlyArray<EmojiCategory>;
  className?: string;
}

/** The reactions of a message: emoji and count, yours pressed, who reacted in a tooltip, and add. */
export function ReactionBar({
  reactions,
  currentUserId,
  onToggle,
  canAdd = true,
  readOnly,
  categories = CONVERSATION_EMOJI,
  className,
}: ReactionBarProps) {
  const [open, setOpen] = useState(false);
  const [recents, setRecents] = useState<ReadonlyArray<string>>([]);
  if (reactions.length === 0 && (!canAdd || readOnly)) return null;
  return (
    <div className={cx("fg-conv-reactions", className)} role="group" aria-label="Reactions">
      {reactions.map((reaction) => {
        const mine = reaction.users.some((u) => u.id === currentUserId);
        const said = conversationReactionLabel(
          reaction,
          currentUserId,
          conversationEmojiName(reaction.emoji, categories),
        );
        return (
          <Tooltip key={reaction.emoji} content={said}>
            <button
              type="button"
              className={cx("fg-conv-reaction", mine && "fg-conv-reaction-mine")}
              aria-pressed={mine}
              aria-label={`${said}, ${reaction.users.length}`}
              disabled={readOnly}
              onClick={() => onToggle(reaction.emoji)}
            >
              <span aria-hidden="true">{reaction.emoji}</span>
              <span className="fg-conv-reaction-count" aria-hidden="true">
                {reaction.users.length}
              </span>
            </button>
          </Tooltip>
        );
      })}
      {canAdd && !readOnly ? (
        <Popover
          label="Add a reaction"
          open={open}
          onOpenChange={setOpen}
          width={300}
          trigger={
            <IconButton icon={SmilePlusIcon} label="Add a reaction" size="sm" variant="boxed" />
          }
        >
          <EmojiPicker
            autoFocus
            categories={categories}
            recents={recents}
            onRecentsChange={setRecents}
            onSelect={(emoji) => {
              onToggle(emoji);
              setOpen(false);
            }}
          />
        </Popover>
      ) : null}
    </div>
  );
}
