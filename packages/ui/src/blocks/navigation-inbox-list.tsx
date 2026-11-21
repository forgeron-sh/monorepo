// The notifications of an inbox, one row each: who (an avatar, or a pixel icon for the system),
// the record and its title, bold while unread, one line of what happened, how long ago with the
// ember LED of unread. One list stop on Tab; the arrows (and j / k) move the selection.
//
// A root with parts. Without children, `InboxList` draws a row for each item; with children, they
// are the rows, composed from the parts (the root still takes `items` for the keyboard):
//
//   <InboxList items={items} selectedId={id} onSelect={setId}>
//     {items.map((i) => (
//       <InboxListRow key={i.id} id={i.id} unread={i.unread}>
//         <InboxListWho person={i.person} />
//         <InboxListTitle reference={i.reference}>{i.title}</InboxListTitle>
//         <InboxListTime unread={i.unread} dateTime={i.dateTime}>{i.time}</InboxListTime>
//         <InboxListPreview>{i.preview}</InboxListPreview>
//       </InboxListRow>
//     ))}
//   </InboxList>

import type { IconDefinition } from "@forgeron/icons";
import type { ComponentProps, ReactNode } from "react";
import { createContext, useContext } from "react";
import { Avatar } from "../avatar";
import { cx } from "../cx";
import { useCollection } from "../hooks/use-collection";
import { Icon } from "../icon";
import { renderPart, type Part } from "../part";

export interface InboxItem {
  id: string;
  /** The record's title: Supplier invoices arrive twice from Odoo. */
  title: string;
  /** The record's reference, in mono before the title: OPS-40. */
  reference?: string;
  /** One line of what happened: Hugo Bernard commented: “Odoo sends the webhook twice…”. */
  preview: string;
  /** How long ago, already written: `2h`, `1d`. */
  time: string;
  /** The same moment for the `<time>` element, ISO 8601. */
  dateTime?: string;
  unread?: boolean;
  /** Who did it: their avatar. */
  person?: string;
  /** A pixel icon when nobody did it (a reminder, an overdue date). */
  icon?: IconDefinition;
}

export interface InboxListProps {
  items: ReadonlyArray<InboxItem>;
  /** The notification shown next to the list, or null. */
  selectedId?: string | null;
  /** On click, and on the arrows and j / k: selection follows the keyboard. */
  onSelect: (id: string) => void;
  /** Names the list for assistive technology. */
  label?: string;
  /** Shown when there is nothing, in place of the rows. */
  empty?: ReactNode;
  /** The rows, composed from the parts; without them, one row for each item. */
  children?: ReactNode;
  className?: string;
}

type Collection = ReturnType<typeof useCollection<InboxItem>>;
const Ctx = createContext<Collection | null>(null);

function useInbox(part: string): Collection {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error(`<${part}> goes inside an <InboxList>.`);
  return ctx;
}

/** Notification rows, newest first: unread in bold with the ember LED, the selected one marked. */
export function InboxList({
  items,
  selectedId = null,
  onSelect,
  label = "Notifications",
  empty = "No notifications",
  children,
  className,
}: InboxListProps) {
  // Selection follows the keyboard: the focused row is the selected one, and the parent owns both.
  const collection = useCollection({
    items,
    getId: (i) => i.id,
    selectionMode: "single",
    selected: selectedId ? [selectedId] : [],
    onSelectedChange: (ids) => {
      if (ids[0] !== undefined) onSelect(ids[0]);
    },
    focused: selectedId,
    focusMode: "activedescendant",
    clearOnEscape: false,
    vimKeys: true,
  });

  if (items.length === 0) {
    return (
      <div data-slot="inbox-list" className={cx("fg-inbox fg-inbox-empty", className)}>
        {empty}
      </div>
    );
  }
  return (
    <Ctx.Provider value={collection}>
      <ul
        data-slot="inbox-list"
        {...collection.getContainerProps({
          className: cx("fg-inbox", className),
          role: "listbox",
          "aria-label": label,
        })}
      >
        {children ??
          items.map((item) => (
            <InboxListRow key={item.id} id={item.id} unread={Boolean(item.unread)}>
              <InboxListWho
                {...(item.person ? { person: item.person } : {})}
                {...(item.icon ? { icon: item.icon } : {})}
              />
              <InboxListTitle {...(item.reference ? { reference: item.reference } : {})}>
                {item.title}
              </InboxListTitle>
              <InboxListTime
                unread={Boolean(item.unread)}
                {...(item.dateTime ? { dateTime: item.dateTime } : {})}
              >
                {item.time}
              </InboxListTime>
              <InboxListPreview>{item.preview}</InboxListPreview>
            </InboxListRow>
          ))}
      </ul>
    </Ctx.Provider>
  );
}

export interface InboxListRowProps extends Part<Omit<ComponentProps<"li">, "id">> {
  /** The id of the item, as the list's `items` give it. */
  id: string;
  /** Bold, with the ember LED in `InboxListTime`. */
  unread?: boolean;
  asChild?: boolean;
}

/** One notification: the row that is selected, focused and marked unread. */
export function InboxListRow({ id, unread, asChild, className, ...rest }: InboxListRowProps) {
  const collection = useInbox("InboxListRow");
  const { className: own, ...props } = collection.getItemProps(id, {
    role: "option",
    className: cx("fg-inbox-row", unread && "fg-inbox-unread", className),
    ...rest,
  });
  return renderPart("li", own, asChild, { "data-slot": "inbox-list-row", ...props });
}

/** Who: an avatar, or a pixel icon when nobody did it. */
export function InboxListWho({
  person,
  icon,
  className,
  ...rest
}: Part<ComponentProps<"span">> & { person?: string; icon?: IconDefinition }) {
  return (
    <span
      data-slot="inbox-list-who"
      aria-hidden="true"
      {...rest}
      className={cx("fg-inbox-who", className)}
    >
      {person ? (
        <Avatar name={person} size={20} />
      ) : (
        <span className="fg-inbox-sys">
          {icon ? <Icon icon={icon} size={12} variant="mono" /> : null}
        </span>
      )}
    </span>
  );
}

/** The title of the record, with its reference in mono before it. */
export function InboxListTitle({
  reference,
  className,
  children,
  ...rest
}: Part<ComponentProps<"span">> & { reference?: string }) {
  return (
    <span data-slot="inbox-list-title" {...rest} className={cx("fg-inbox-title", className)}>
      {reference ? <span className="fg-inbox-ref">{reference}</span> : null}
      {children}
    </span>
  );
}

/** How long ago, with the ember LED when unread. */
export function InboxListTime({
  unread,
  dateTime,
  className,
  children,
  ...rest
}: Part<ComponentProps<"span">> & { unread?: boolean; dateTime?: string }) {
  return (
    <span data-slot="inbox-list-time" {...rest} className={cx("fg-inbox-time", className)}>
      {unread ? (
        <>
          <span className="fg-led fg-led-accent" aria-hidden="true" />
          <span className="fg-sr">Unread, </span>
        </>
      ) : null}
      {dateTime ? <time dateTime={dateTime}>{children}</time> : children}
    </span>
  );
}

/** One line of what happened. */
export function InboxListPreview({ className, ...rest }: Part<ComponentProps<"span">>) {
  return (
    <span data-slot="inbox-list-preview" {...rest} className={cx("fg-inbox-preview", className)} />
  );
}
