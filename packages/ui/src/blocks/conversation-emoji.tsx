// Emoji and reactions. The glyphs are user content (a reaction is written by a person, like the text
// of a message), the one place of the library where they are allowed; the controls around them are
// the usual pixel icons. EmojiPicker: search, categories, recents, arrow keys. ReactionBar: a toggle
// per emoji with its count and, on hover or focus, who reacted, then a button that opens the picker.

import { Search01Icon, SmilePlusIcon } from "@forgeron/icons";
import type { KeyboardEvent } from "react";
import { useMemo, useRef, useState } from "react";
import { cx } from "../cx";
import { useControllableState } from "../hooks/use-controllable";
import { Icon } from "../icon";
import { IconButton } from "../identity";
import { Popover } from "../popover";
import { Tooltip } from "../overlays";
import {
  CONVERSATION_EMOJI,
  conversationEmojiName,
  conversationReactionLabel,
  pushRecentEmoji,
  searchConversationEmoji,
  type ConversationReaction,
  type EmojiCategory,
  type EmojiEntry,
} from "./conversation-model";

export interface EmojiPickerProps {
  /** Called with the character chosen. */
  onSelect: (emoji: string) => void;
  /** Your own set, in place of the built-in one. */
  categories?: ReadonlyArray<EmojiCategory>;
  /** The latest chosen, newest first; the picker keeps them itself unless you do. */
  recents?: ReadonlyArray<string>;
  defaultRecents?: ReadonlyArray<string>;
  onRecentsChange?: (recents: string[]) => void;
  /** How many recents are kept. Default 16. */
  maxRecents?: number;
  /** Names the picker. Default "Emoji". */
  label?: string;
  /** Focuses the search box on mount (in a popup). */
  autoFocus?: boolean;
  /** Emoji per row. Default 8. */
  columns?: number;
  className?: string;
}

const RECENT = "recent";

/** A search box, a row of categories, the recents and a grid you move through with the arrows. */
export function EmojiPicker({
  onSelect,
  categories = CONVERSATION_EMOJI,
  recents,
  defaultRecents = [],
  onRecentsChange,
  maxRecents = 16,
  label = "Emoji",
  autoFocus,
  columns = 8,
  className,
}: EmojiPickerProps) {
  const [recent, setRecent] = useControllableState<ReadonlyArray<string>>({
    value: recents,
    defaultValue: defaultRecents,
    onChange: (next) => onRecentsChange?.([...next]),
  });
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>(recent.length > 0 ? RECENT : categories[0]!.id);
  const [active, setActive] = useState(0);
  const grid = useRef<HTMLDivElement>(null);

  const recentEntries = useMemo<EmojiEntry[]>(
    () => recent.map((char) => ({ char, name: conversationEmojiName(char, categories) })),
    [recent, categories],
  );
  const searching = query.trim() !== "";
  const entries: ReadonlyArray<EmojiEntry> = searching
    ? searchConversationEmoji(query, categories)
    : category === RECENT
      ? recentEntries
      : (categories.find((c) => c.id === category)?.emoji ?? []);
  const tab = Math.min(active, Math.max(entries.length - 1, 0));
  const tabs: Array<{ id: string; label: string; mark: string }> = [
    ...(recent.length > 0 ? [{ id: RECENT, label: "Recent", mark: "🕘" }] : []),
    ...categories,
  ];

  const choose = (entry: EmojiEntry) => {
    setRecent(pushRecentEmoji(recent, entry.char, maxRecents));
    onSelect(entry.char);
  };
  const focusAt = (to: number) => {
    const next = Math.max(0, Math.min(entries.length - 1, to));
    setActive(next);
    grid.current?.querySelectorAll<HTMLElement>("[data-emoji]")[next]?.focus();
  };
  const onKey = (event: KeyboardEvent) => {
    const step: Record<string, number> = {
      ArrowRight: 1,
      ArrowLeft: -1,
      ArrowDown: columns,
      ArrowUp: -columns,
    };
    if (event.key in step) focusAt(tab + step[event.key]!);
    else if (event.key === "Home") focusAt(0);
    else if (event.key === "End") focusAt(entries.length - 1);
    else return;
    event.preventDefault();
  };

  return (
    <div className={cx("fg-conv-emoji", className)} role="group" aria-label={label}>
      <div className="fg-conv-emoji-search">
        <Icon icon={Search01Icon} size={12} variant="mono" />
        <input
          type="search"
          className="fg-conv-emoji-input"
          aria-label={`Search ${label.toLowerCase()}`}
          placeholder="Search"
          value={query}
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus={autoFocus}
          onChange={(event) => {
            setQuery(event.target.value);
            setActive(0);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown" && entries.length > 0) {
              event.preventDefault();
              focusAt(0);
            }
          }}
        />
      </div>
      {!searching ? (
        <div className="fg-conv-emoji-tabs" role="group" aria-label="Categories">
          {tabs.map((tabItem) => (
            <button
              key={tabItem.id}
              type="button"
              className="fg-conv-emoji-tab"
              aria-pressed={category === tabItem.id}
              aria-label={tabItem.label}
              title={tabItem.label}
              onClick={() => {
                setCategory(tabItem.id);
                setActive(0);
              }}
            >
              {tabItem.mark}
            </button>
          ))}
        </div>
      ) : null}
      <div
        ref={grid}
        className="fg-conv-emoji-grid"
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        role="group"
        aria-label={searching ? "Results" : (tabs.find((t) => t.id === category)?.label ?? label)}
        onKeyDown={onKey}
      >
        {entries.map((entry, index) => (
          <button
            key={`${entry.char}-${index}`}
            type="button"
            data-emoji=""
            className="fg-conv-emoji-cell"
            tabIndex={index === tab ? 0 : -1}
            aria-label={entry.name}
            title={entry.name}
            onClick={() => choose(entry)}
            onFocus={() => setActive(index)}
          >
            {entry.char}
          </button>
        ))}
        {entries.length === 0 ? (
          <p className="fg-conv-emoji-empty">
            {searching ? "No emoji found." : "Nothing here yet."}
          </p>
        ) : null}
      </div>
    </div>
  );
}

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
