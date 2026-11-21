// Reactions: a toggle per emoji with its count and, on hover or focus, who reacted, then a button
// that opens the EmojiPicker (a primitive, `emoji-picker.tsx`). It stays a block: it speaks of
// messages and reactors.
//
// With `reactions` alone it is the usual bar. With children it is a frame, and the parts compose it:
//
//   <ReactionBar reactions={reactions} currentUserId="me" onToggle={toggle}>
//     <ReactionBarChips />
//     <ReactionBarAdd />
//   </ReactionBar>

import { SmilePlusIcon } from "@forgeron/icons";
import { createContext, useContext, useState, type ReactElement, type ReactNode } from "react";
import { cx } from "../cx";
import {
  CONVERSATION_EMOJI,
  conversationEmojiName,
  EmojiPicker,
  type EmojiCategory,
} from "../emoji-picker";
import { IconButton } from "../identity";
import { Popover, PopoverContent, PopoverTrigger } from "../popover";
import { Tooltip } from "../tooltip";
import { conversationReactionLabel, type ConversationReaction } from "./conversation-model";
import { part, type PartProps } from "../part";

interface BarContext {
  currentUserId: string;
  onToggle: (emoji: string) => void;
  readOnly: boolean;
  categories: ReadonlyArray<EmojiCategory>;
  reactions: ReadonlyArray<ConversationReaction>;
}
const BarCtx = createContext<BarContext | null>(null);

function useBar(name: string): BarContext {
  const ctx = useContext(BarCtx);
  if (!ctx) throw new Error(`<${name}> goes inside a <ReactionBar>.`);
  return ctx;
}

export interface ReactionBarChipProps extends Omit<PartProps<"button">, "children" | "onClick"> {
  reaction: ConversationReaction;
}

/** One emoji with its count: pressed when yours, who reacted in a tooltip. */
export function ReactionBarChip({ reaction, className, asChild, ...rest }: ReactionBarChipProps) {
  const { currentUserId, onToggle, readOnly, categories } = useBar("ReactionBarChip");
  const mine = reaction.users.some((u) => u.id === currentUserId);
  const said = conversationReactionLabel(
    reaction,
    currentUserId,
    conversationEmojiName(reaction.emoji, categories),
  );
  return (
    <Tooltip content={said}>
      {
        part(
          "button",
          "reaction-bar-chip",
          cx("fg-conv-reaction", mine && "fg-conv-reaction-mine"),
          {
            className,
            asChild,
            disabled: readOnly,
            onClick: () => onToggle(reaction.emoji),
            ...rest,
            children: (
              <>
                <span aria-hidden="true">{reaction.emoji}</span>
                <span className="fg-conv-reaction-count" aria-hidden="true">
                  {reaction.users.length}
                </span>
              </>
            ),
          } as PartProps<"button">,
          {
            type: "button",
            "aria-pressed": mine,
            "aria-label": `${said}, ${reaction.users.length}`,
          },
        ) as ReactElement
      }
    </Tooltip>
  );
}

/** A chip for each reaction of the bar. */
export function ReactionBarChips() {
  const { reactions } = useBar("ReactionBarChips");
  return (
    <>
      {reactions.map((reaction) => (
        <ReactionBarChip key={reaction.emoji} reaction={reaction} />
      ))}
    </>
  );
}

/** The button that opens the picker; its emoji is toggled and the picker closes. */
export function ReactionBarAdd({ label = "Add a reaction" }: { label?: string }) {
  const { onToggle, readOnly, categories } = useBar("ReactionBarAdd");
  const [open, setOpen] = useState(false);
  const [recents, setRecents] = useState<ReadonlyArray<string>>([]);
  if (readOnly) return null;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <IconButton icon={SmilePlusIcon} label={label} size="sm" variant="boxed" />
      </PopoverTrigger>
      <PopoverContent align="start" aria-label={label} style={{ width: 300 }}>
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
      </PopoverContent>
    </Popover>
  );
}

export interface ReactionBarProps extends Omit<PartProps<"div">, "children" | "onToggle"> {
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
  /** The parts (`ReactionBarChips`, `ReactionBarChip`, `ReactionBarAdd`). */
  children?: ReactNode;
}

/** The reactions of a message: emoji and count, yours pressed, who reacted in a tooltip, and add. */
export function ReactionBar({
  reactions,
  currentUserId,
  onToggle,
  canAdd = true,
  readOnly,
  categories = CONVERSATION_EMOJI,
  children,
  ...rest
}: ReactionBarProps) {
  if (children === undefined && reactions.length === 0 && (!canAdd || readOnly)) return null;
  const ctx: BarContext = {
    currentUserId,
    onToggle,
    readOnly: Boolean(readOnly),
    categories,
    reactions,
  };
  return (
    <BarCtx.Provider value={ctx}>
      {part(
        "div",
        "reaction-bar",
        "fg-conv-reactions",
        {
          ...rest,
          children: children ?? (
            <>
              <ReactionBarChips />
              {canAdd ? <ReactionBarAdd /> : null}
            </>
          ),
        },
        { role: "group", "aria-label": "Reactions" },
      )}
    </BarCtx.Provider>
  );
}
