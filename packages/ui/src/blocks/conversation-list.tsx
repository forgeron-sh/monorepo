// The conversations of an app: one row each with an avatar (or the avatars of a group) and a
// presence square, the title, the last message, the time, a count of unread, pinned and muted
// marks, and "typing…". Rows can sit under section headings. One tab stop for the list; the arrows
// (and j / k) move, Enter or a click opens. Richer than InboxList, for chats, mail and tickets.
//
// With `items` alone it is the usual list. With children it is a frame, and the parts compose it
// (`items` still names the conversations for the keyboard):
//
//   <ConversationList items={items} selectedId={id} onSelect={open} sections={sections}>
//     <ConversationListGroups
//       renderRow={(item) => (
//         <ConversationListRow item={item}>
//           <ConversationListWho /><ConversationListTitle /><ConversationListTime />
//           <ConversationListPreview /><ConversationListCount />
//         </ConversationListRow>
//       )}
//     />
//   </ConversationList>

import { BellOffIcon, Pin02Icon } from "@forgeron/icons";
import { createContext, Fragment, useContext, useState, type ReactNode } from "react";
import { Avatar } from "../avatar";
import { cx } from "../cx";
import { useCollection, type Collection } from "../hooks/use-collection";
import { Icon } from "../icon";
import { AvatarGroup } from "../identity";
import {
  conversationListTime,
  conversationUnreadLabel,
  groupConversationItems,
  type ConversationSection,
} from "./conversation-model";
import { part, type PartProps } from "../part";
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

/* ---------------------------------------------------------------- context */

interface ListContext {
  label: string;
  groups: ReadonlyArray<ConversationSection<ConversationListItem>>;
  collection: Collection;
  activeId: string | null;
  nowIso: string;
  timeZone: string | undefined;
}
const ListCtx = createContext<ListContext | null>(null);
const RowCtx = createContext<ConversationListItem | null>(null);

function useList(name: string): ListContext {
  const ctx = useContext(ListCtx);
  if (!ctx) throw new Error(`<${name}> goes inside a <ConversationList>.`);
  return ctx;
}
function useRow(name: string): ConversationListItem {
  const item = useContext(RowCtx);
  if (!item) throw new Error(`<${name}> goes inside a <ConversationListRow>.`);
  return item;
}

/* ---------------------------------------------------------------- parts */

/** A section: its heading (when it has one) and its rows. */
export function ConversationListSection({
  group,
  children,
  ...rest
}: Omit<PartProps<"div">, "children"> & {
  group: ConversationSection<ConversationListItem>;
  children?: ReactNode;
}) {
  const { label } = useList("ConversationListSection");
  return part(
    "div",
    "conversation-list-section",
    "fg-conv-section",
    {
      ...rest,
      children: (
        <>
          {group.label ? (
            <div
              className="fg-conv-section-head"
              data-slot="conversation-list-heading"
              aria-hidden="true"
            >
              {group.label}
            </div>
          ) : null}
          {children ?? group.items.map((item) => <ConversationListRow key={item.id} item={item} />)}
        </>
      ),
    },
    { role: "group", "aria-label": group.label || label },
  );
}

/** The sections of the list, each with its rows; `renderRow` draws a row your way. */
export function ConversationListGroups({
  renderRow,
}: {
  renderRow?: (item: ConversationListItem) => ReactNode;
}) {
  const { groups } = useList("ConversationListGroups");
  return (
    <>
      {groups.map((group) => (
        <ConversationListSection key={group.id} group={group}>
          {renderRow
            ? group.items.map((item) => <Fragment key={item.id}>{renderRow(item)}</Fragment>)
            : undefined}
        </ConversationListSection>
      ))}
    </>
  );
}

/** One conversation: an option of the listbox. Without children, the usual parts. */
export function ConversationListRow({
  item,
  children,
  ...rest
}: Omit<PartProps<"div">, "children"> & { item: ConversationListItem; children?: ReactNode }) {
  const { collection, activeId } = useList("ConversationListRow");
  const unread = item.unread ?? 0;
  return (
    <RowCtx.Provider value={item}>
      {part(
        "div",
        "conversation-list-row",
        cx(
          "fg-conv-row",
          unread > 0 && "fg-conv-row-unread",
          item.muted && "fg-conv-row-muted",
          item.id === activeId && "fg-conv-row-active",
        ),
        {
          ...rest,
          children: children ?? (
            <>
              <ConversationListWho />
              <ConversationListTitle />
              <ConversationListTime />
              <ConversationListPreview />
              <ConversationListCount />
            </>
          ),
        },
        { ...collection.getItemProps(item.id), role: "option" },
      )}
    </RowCtx.Provider>
  );
}

/** The avatar of the person, or of the first two of a group, with a presence square. */
export function ConversationListWho(props: PartProps<"span">) {
  const item = useRow("ConversationListWho");
  const group = (item.people?.length ?? 0) > 1;
  return part(
    "span",
    "conversation-list-who",
    "fg-conv-row-who",
    {
      ...props,
      children: props.children ?? (
        <>
          {group ? (
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
          {item.presence && !group ? (
            <PresenceDot status={item.presence} className="fg-conv-row-presence" />
          ) : null}
        </>
      ),
    },
    group ? {} : { "aria-hidden": true },
  );
}

/** The title, with the marks of a pinned or muted conversation. */
export function ConversationListTitle({ children, ...rest }: PartProps<"span">) {
  const item = useRow("ConversationListTitle");
  return part("span", "conversation-list-title", "fg-conv-row-title", {
    ...rest,
    children: children ?? (
      <>
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
      </>
    ),
  });
}

/** When the last message was written. */
export function ConversationListTime({ children, ...rest }: PartProps<"span">) {
  const item = useRow("ConversationListTime");
  const { nowIso, timeZone } = useList("ConversationListTime");
  const time = item.time ?? (item.at ? conversationListTime(item.at, nowIso, timeZone) : "");
  return part("span", "conversation-list-time", "fg-conv-row-time", {
    ...rest,
    children: children ?? time,
  });
}

/** The last message, or "typing…". */
export function ConversationListPreview({ children, ...rest }: PartProps<"span">) {
  const item = useRow("ConversationListPreview");
  return part("span", "conversation-list-preview", "fg-conv-row-preview", {
    ...rest,
    children:
      children ??
      (item.typing ? (
        <span className="fg-conv-row-typing">typing…</span>
      ) : (
        <>
          {item.previewAuthor ? (
            <span className="fg-conv-row-by">{item.previewAuthor}: </span>
          ) : null}
          {item.preview}
        </>
      )),
  });
}

/** The count of unread messages, with a mark when one mentions the person. */
export function ConversationListCount({ children, ...rest }: PartProps<"span">) {
  const item = useRow("ConversationListCount");
  const unread = item.unread ?? 0;
  return part("span", "conversation-list-count", "fg-conv-row-count", {
    ...rest,
    children:
      children ??
      (unread > 0 ? (
        <span className={cx("fg-conv-badge", item.mention && "fg-conv-badge-mention")}>
          {item.mention ? <span aria-hidden="true">@</span> : null}
          {conversationUnreadLabel(unread)}
          <span className="fg-sr"> unread{item.mention ? ", you are mentioned" : ""}</span>
        </span>
      ) : null),
  });
}

/* ---------------------------------------------------------------- the list */

export interface ConversationListProps extends Omit<PartProps<"div">, "children" | "onSelect"> {
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
  /** The parts. Without them, the list is built from the props. */
  children?: ReactNode;
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
  children,
  className,
  asChild,
  ...rest
}: ConversationListProps) {
  const pinning = pinnedLabel !== false && items.some((i) => i.pinned);
  const groups = groupConversationItems(
    items,
    sections && sections.length > 0 ? sections : pinning ? [{ id: "", label: restLabel }] : [],
    pinnedLabel === false ? undefined : { label: pinnedLabel },
  );
  const flat = groups.flatMap((g) => g.items);
  // The cursor moves with the arrows; the selection is the conversation open, chosen with Enter,
  // Space or a click, and the parent owns it.
  const collection = useCollection({
    items: flat,
    getId: (i) => i.id,
    selectionMode: "single",
    selected: selectedId ? [selectedId] : [],
    onSelectedChange: (ids) => {
      if (ids[0] !== undefined) onSelect(ids[0]);
    },
    onAction: onSelect,
    focusMode: "activedescendant",
    focusFirst: true,
    followFocus: false,
    actOnDoubleClick: false,
    clearOnEscape: false,
    vimKeys: true,
  });
  const [mounted] = useState(() => new Date().toISOString());
  const nowIso = now ?? mounted;

  if (flat.length === 0 && children === undefined) {
    return part("div", "conversation-list", "fg-conv-list fg-conv-list-empty", {
      className,
      asChild,
      ...rest,
      children: empty,
    });
  }

  return (
    <ListCtx.Provider
      value={{ label, groups, collection, activeId: collection.activeId, nowIso, timeZone }}
    >
      {part(
        "div",
        "conversation-list",
        "fg-conv-list",
        { className, asChild, ...rest, children: children ?? <ConversationListGroups /> },
        { ...collection.getContainerProps(), role: "listbox", "aria-label": label },
      )}
    </ListCtx.Provider>
  );
}
