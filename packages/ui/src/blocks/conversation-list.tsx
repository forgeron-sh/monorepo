// The conversations of an app: one row each with an avatar (or the avatars of a group) and a
// presence square, the title, the last message, the time, a count of unread, pinned and muted
// marks, and "typing…". Rows can sit under section headings. One tab stop for the list; the arrows
// (and j / k) move, Enter or a click opens. Richer than InboxList, for chats, mail and tickets.

import { BellOffIcon, Pin02Icon } from "@forgeron/icons";
import type { KeyboardEvent, ReactNode } from "react";
import { useId, useState } from "react";
import { Avatar } from "../avatar";
import { cx } from "../cx";
import { Icon } from "../icon";
import { AvatarGroup } from "../identity";
import {
  conversationListTime,
  conversationUnreadLabel,
  groupConversationItems,
} from "./conversation-model";
import { PresenceDot, type PresenceStatus } from "./conversation-presence";

export interface ConversationListItem {
  id: string;
  title: string;
  /** The people, by name: one gives an avatar with a presence square, several a group. */
  people?: ReadonlyArray<string>;
  /** A picture for a single person. */
  avatar?: string;
  /** Presence of the person, for a one-to-one conversation. */
  presence?: PresenceStatus;
  /** The last message, one line. */
  preview?: string;
  /** Who wrote it, shown before it: "You". */
  previewAuthor?: string;
  /** ISO 8601 of the last message; written for the row as `09:41`, `Yesterday`, `Mon`, `16 Nov`. */
  at?: string;
  /** The time already written, in place of `at`. */
  time?: string;
  /** Messages not read. */
  unread?: number;
  /** One of the unread mentions the person. */
  mention?: boolean;
  pinned?: boolean;
  muted?: boolean;
  /** Someone is writing: replaces the preview. */
  typing?: boolean;
  /** The id of its section, when the list has `sections`. */
  section?: string;
}

export interface ConversationListProps {
  items: ReadonlyArray<ConversationListItem>;
  /** The conversation open next to the list. */
  selectedId?: string | null;
  /** On a click and on Enter or Space. */
  onSelect: (id: string) => void;
  /** Section headings, in order: `[{ id: "channels", label: "Channels" }]`. */
  sections?: ReadonlyArray<{ id: string; label: string }>;
  /** Pinned conversations go in a section above the rest with this heading; `false` leaves them in place. Default "Pinned". */
  pinnedLabel?: string | false;
  /** The heading of the rest, under the pinned ones, when there are no `sections`. Default "All". */
  restLabel?: string;
  /** "Now" for the times of the rows; the current time by default. */
  now?: string;
  timeZone?: string;
  /** Names the list for assistive technology. Default "Conversations". */
  label?: string;
  /** Shown when there is nothing. */
  empty?: ReactNode;
  className?: string;
}

/** Conversations with avatars, presence, preview, time, unread, pinned and muted, in sections. */
export function ConversationList({
  items,
  selectedId = null,
  onSelect,
  sections,
  pinnedLabel = "Pinned",
  restLabel = "All",
  now,
  timeZone,
  label = "Conversations",
  empty = "No conversations",
  className,
}: ConversationListProps) {
  const base = useId();
  const rowId = (id: string) => `${base}-${id}`;
  const pinning = pinnedLabel !== false && items.some((i) => i.pinned);
  const groups = groupConversationItems(
    items,
    sections && sections.length > 0 ? sections : pinning ? [{ id: "", label: restLabel }] : [],
    pinnedLabel === false ? undefined : { label: pinnedLabel },
  );
  const flat = groups.flatMap((g) => g.items);
  const [cursor, setCursor] = useState<string | null>(null);
  const activeId =
    (cursor && flat.some((i) => i.id === cursor) ? cursor : null) ??
    (selectedId && flat.some((i) => i.id === selectedId) ? selectedId : null) ??
    flat[0]?.id ??
    null;
  const [mounted] = useState(() => new Date().toISOString());
  const nowIso = now ?? mounted;

  const go = (to: number) => {
    const item = flat[Math.max(0, Math.min(flat.length - 1, to))];
    if (!item) return;
    setCursor(item.id);
    document.getElementById(rowId(item.id))?.scrollIntoView?.({ block: "nearest" });
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    const at = flat.findIndex((i) => i.id === activeId);
    const k = event.key;
    if (k === "ArrowDown" || k === "j") go(at + 1);
    else if (k === "ArrowUp" || k === "k") go(at - 1);
    else if (k === "Home") go(0);
    else if (k === "End") go(flat.length - 1);
    else if ((k === "Enter" || k === " ") && activeId) onSelect(activeId);
    else return;
    event.preventDefault();
  };

  if (flat.length === 0)
    return <div className={cx("fg-conv-list", "fg-conv-list-empty", className)}>{empty}</div>;

  return (
    <div
      className={cx("fg-conv-list", className)}
      role="listbox"
      aria-label={label}
      tabIndex={0}
      {...(activeId ? { "aria-activedescendant": rowId(activeId) } : {})}
      onKeyDown={onKeyDown}
    >
      {groups.map((group) => {
        const rows = group.items.map((item) => {
          const selected = item.id === selectedId;
          const group2 = (item.people?.length ?? 0) > 1;
          const time =
            item.time ?? (item.at ? conversationListTime(item.at, nowIso, timeZone) : "");
          const unread = item.unread ?? 0;
          return (
            <div
              key={item.id}
              id={rowId(item.id)}
              role="option"
              aria-selected={selected}
              className={cx(
                "fg-conv-row",
                unread > 0 && "fg-conv-row-unread",
                item.muted && "fg-conv-row-muted",
                item.id === activeId && "fg-conv-row-active",
              )}
              onClick={() => {
                setCursor(item.id);
                onSelect(item.id);
              }}
            >
              <span className="fg-conv-row-who" aria-hidden={group2 ? undefined : true}>
                {group2 ? (
                  <AvatarGroup
                    names={item.people!.slice(0, 2)}
                    max={2}
                    size={20}
                    label={item.people!.join(", ")}
                  />
                ) : (
                  <Avatar
                    name={item.people?.[0] ?? item.title}
                    size={32}
                    {...(item.avatar ? { src: item.avatar } : {})}
                  />
                )}
                {item.presence && !group2 ? (
                  <PresenceDot status={item.presence} className="fg-conv-row-presence" />
                ) : null}
              </span>
              <span className="fg-conv-row-title">
                <span className="fg-conv-row-name">{item.title}</span>
                {item.pinned ? (
                  <span className="fg-conv-row-mark">
                    <Icon icon={Pin02Icon} size={12} variant="mono" title="Pinned" />
                  </span>
                ) : null}
                {item.muted ? (
                  <span className="fg-conv-row-mark">
                    <Icon icon={BellOffIcon} size={12} variant="mono" title="Muted" />
                  </span>
                ) : null}
              </span>
              <span className="fg-conv-row-time">{time}</span>
              <span className="fg-conv-row-preview">
                {item.typing ? (
                  <span className="fg-conv-row-typing">typing…</span>
                ) : (
                  <>
                    {item.previewAuthor ? (
                      <span className="fg-conv-row-by">{item.previewAuthor}: </span>
                    ) : null}
                    {item.preview}
                  </>
                )}
              </span>
              <span className="fg-conv-row-count">
                {unread > 0 ? (
                  <span className={cx("fg-conv-badge", item.mention && "fg-conv-badge-mention")}>
                    {item.mention ? <span aria-hidden="true">@</span> : null}
                    {conversationUnreadLabel(unread)}
                    <span className="fg-sr">
                      {" "}
                      unread{item.mention ? ", you are mentioned" : ""}
                    </span>
                  </span>
                ) : null}
              </span>
            </div>
          );
        });
        return group.label ? (
          <div key={group.id} role="group" aria-label={group.label} className="fg-conv-section">
            <div className="fg-conv-section-head" aria-hidden="true">
              {group.label}
            </div>
            {rows}
          </div>
        ) : (
          <div key={group.id} role="group" aria-label={label} className="fg-conv-section">
            {rows}
          </div>
        );
      })}
    </div>
  );
}
