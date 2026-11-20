// The notifications of an inbox, one row each: who (an avatar, or a pixel icon for the system),
// the record and its title, bold while unread, one line of what happened, how long ago with the
// ember LED of unread. One list stop on Tab; the arrows (and j / k) move the selection.

import type { IconDefinition } from "@forgeron/icons";
import type { ReactNode } from "react";
import { Avatar } from "../avatar";
import { cx } from "../cx";
import { useCollection } from "../hooks/use-collection";
import { Icon } from "../icon";

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
  className?: string;
}

/** Notification rows, newest first: unread in bold with the ember LED, the selected one marked. */
export function InboxList({
  items,
  selectedId = null,
  onSelect,
  label = "Notifications",
  empty = "No notifications",
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
    return <div className={cx("fg-inbox fg-inbox-empty", className)}>{empty}</div>;
  }
  return (
    <ul
      {...collection.getContainerProps({
        className: cx("fg-inbox", className),
        role: "listbox",
        "aria-label": label,
      })}
    >
      {items.map((item) => {
        return (
          <li
            key={item.id}
            {...collection.getItemProps(item.id, {
              role: "option",
              className: cx("fg-inbox-row", item.unread && "fg-inbox-unread"),
            })}
          >
            <span className="fg-inbox-who" aria-hidden="true">
              {item.person ? (
                <Avatar name={item.person} size={20} />
              ) : (
                <span className="fg-inbox-sys">
                  {item.icon ? <Icon icon={item.icon} size={12} variant="mono" /> : null}
                </span>
              )}
            </span>
            <span className="fg-inbox-title">
              {item.reference ? <span className="fg-inbox-ref">{item.reference}</span> : null}
              {item.title}
            </span>
            <span className="fg-inbox-time">
              {item.unread ? (
                <>
                  <span className="fg-led fg-led-accent" aria-hidden="true" />
                  <span className="fg-sr">Unread, </span>
                </>
              ) : null}
              {item.dateTime ? <time dateTime={item.dateTime}>{item.time}</time> : item.time}
            </span>
            <span className="fg-inbox-preview">{item.preview}</span>
          </li>
        );
      })}
    </ul>
  );
}
