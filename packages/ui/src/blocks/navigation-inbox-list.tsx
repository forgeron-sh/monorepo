// The notifications of an inbox, one row each: who (an avatar, or a pixel icon for the system),
// the record and its title, bold while unread, one line of what happened, how long ago with the
// ember LED of unread. One list stop on Tab; the arrows (and j / k) move the selection.

import type { IconDefinition } from "@forgeron/icons";
import type { KeyboardEvent, ReactNode } from "react";
import { useId } from "react";
import { Avatar } from "../avatar";
import { cx } from "../cx";
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
  const base = useId();
  const rowId = (id: string) => `${base}-${id}`;
  const index = items.findIndex((i) => i.id === selectedId);

  const go = (next: number) => {
    const item = items[Math.max(0, Math.min(items.length - 1, next))];
    if (!item || item.id === selectedId) return;
    onSelect(item.id);
    document.getElementById(rowId(item.id))?.scrollIntoView?.({ block: "nearest" });
  };
  const onKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    const k = event.key;
    if (k === "ArrowDown" || k === "j") go(index < 0 ? 0 : index + 1);
    else if (k === "ArrowUp" || k === "k") go(index < 0 ? 0 : index - 1);
    else if (k === "Home") go(0);
    else if (k === "End") go(items.length - 1);
    else return;
    event.preventDefault();
  };

  if (items.length === 0) {
    return <div className={cx("fg-inbox fg-inbox-empty", className)}>{empty}</div>;
  }
  return (
    <ul
      className={cx("fg-inbox", className)}
      role="listbox"
      aria-label={label}
      tabIndex={0}
      {...(index >= 0 ? { "aria-activedescendant": rowId(items[index]!.id) } : {})}
      onKeyDown={onKeyDown}
    >
      {items.map((item) => {
        const selected = item.id === selectedId;
        return (
          <li
            key={item.id}
            id={rowId(item.id)}
            role="option"
            aria-selected={selected}
            className={cx("fg-inbox-row", item.unread && "fg-inbox-unread")}
            onClick={() => onSelect(item.id)}
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
