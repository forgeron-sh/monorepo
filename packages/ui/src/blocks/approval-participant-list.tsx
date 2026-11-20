// The people of an approval, in order: name, role, status, and, when the list is editable, a
// reorder by drag or by Alt + the arrow keys, and a remove. One row is the tab stop; the arrows
// move between rows. Every move is said in a live region.

import { Cancel01Icon, Drag02Icon, Notification01Icon } from "@forgeron/icons";
import type { KeyboardEvent, ReactNode } from "react";
import { useState } from "react";
import { Avatar } from "../avatar";
import { Badge } from "../badge";
import { cx } from "../cx";
import { useControllableState } from "../hooks/use-controllable";
import { Icon } from "../icon";
import { IconButton } from "../identity";
import { useSortable } from "../sortable";
import {
  APPROVAL_STATUS_MARKS,
  APPROVAL_STATUS_NAMES,
  participantTone,
  type ApprovalParticipant,
  type ApprovalStatus,
  formatStamp,
} from "./approval-model";

export interface ParticipantListProps {
  /** Names the list for assistive technology: "Signers". */
  label: string;
  value?: ReadonlyArray<ApprovalParticipant>;
  defaultValue?: ReadonlyArray<ApprovalParticipant>;
  onChange?: (people: ApprovalParticipant[]) => void;
  /** Reorder and remove. Off, the list is only read. */
  editable?: boolean;
  /** Written 1, 2, 3 before each name: the order they act in. `true` by default. */
  ordered?: boolean;
  /** Reorder by drag and by Alt + arrows; follows `editable` by default. */
  reorderable?: boolean;
  /** The remove button; follows `editable` by default. */
  removable?: boolean;
  /** A square of the person's colour, as on the fields of a document. */
  colors?: boolean;
  /** Shows a Remind button on the people whose status is `current`. */
  onRemind?: (person: ApprovalParticipant) => void;
  /** Words for the statuses. */
  statusLabels?: Partial<Record<ApprovalStatus, string>>;
  /** More at the end of a row: a menu, a link. */
  actions?: (person: ApprovalParticipant, index: number) => ReactNode;
  /** Shown when the list is empty. */
  empty?: ReactNode;
  className?: string;
}

/** The people of an approval with their role and status, reordered by drag or Alt + arrows. */
export function ParticipantList({
  label,
  value,
  defaultValue = [],
  onChange,
  editable = false,
  ordered = true,
  reorderable,
  removable,
  colors = false,
  onRemind,
  statusLabels,
  actions,
  empty = "Nobody yet.",
  className,
}: ParticipantListProps) {
  const [people, setPeople] = useControllableState<ReadonlyArray<ApprovalParticipant>>({
    value,
    defaultValue,
    onChange: (next) => onChange?.([...next]),
  });
  const canMove = reorderable ?? editable;
  const canRemove = removable ?? editable;
  const names = { ...APPROVAL_STATUS_NAMES, ...statusLabels };
  const [active, setActive] = useState(0);
  const tab = Math.min(active, Math.max(people.length - 1, 0));
  const sortable = useSortable({
    items: people,
    getId: (p) => p.id,
    getLabel: (p) => p.name,
    onReorder: (next, move) => {
      setPeople(next);
      setActive(move.to);
    },
    label,
    disabled: !canMove,
    navigate: true,
    homeEnd: true,
  });

  const remove = (index: number) => {
    const person = people[index]!;
    const next = people.filter((_, i) => i !== index);
    setPeople(next);
    const neighbour = next[Math.min(index, next.length - 1)];
    // After a removal, the focus goes to the row that took its place.
    if (neighbour) requestAnimationFrame(() => sortable.focusItem(neighbour.id));
    setActive(Math.min(index, Math.max(next.length - 1, 0)));
    sortable.announce(`${person.name} removed.`);
  };

  const onKey = (event: KeyboardEvent<HTMLLIElement>, index: number) => {
    if (event.target !== event.currentTarget) return;
    if ((event.key === "Delete" || event.key === "Backspace") && canRemove) {
      event.preventDefault();
      remove(index);
    }
  };

  if (people.length === 0) {
    return <p className={cx("fg-apl-empty", className)}>{empty}</p>;
  }

  return (
    <div className={cx("fg-apl", className)}>
      <ol {...sortable.getListProps({ className: "fg-apl-list" })}>
        {people.map((p, i) => {
          const status = p.status;
          const mark = status ? APPROVAL_STATUS_MARKS[status] : null;
          return (
            <li
              {...sortable.getItemProps(p.id, {
                tabIndex: i === tab ? 0 : -1,
                className: cx(
                  "fg-apl-row",
                  sortable.getItemState(p.id).dragging && "fg-apl-dragging",
                  sortable.getItemState(p.id).over && "fg-apl-over",
                ),
                "aria-label": `${p.name}${p.role ? `, ${p.role}` : ""}${
                  status ? `, ${names[status]}` : ""
                }, ${i + 1} of ${people.length}`,
                "aria-description": canMove
                  ? "Alt and the up or down arrow moves this person."
                  : undefined,
                onFocus: (e) => {
                  if (e.target === e.currentTarget) setActive(i);
                },
                onKeyDown: (e) => onKey(e as KeyboardEvent<HTMLLIElement>, i),
              })}
              key={p.id}
              data-pid={p.id}
            >
              {canMove ? (
                <span className="fg-apl-grip" aria-hidden="true">
                  <Icon icon={Drag02Icon} size={12} variant="mono" />
                </span>
              ) : null}
              {ordered ? (
                <span className="fg-apl-order" aria-hidden="true">
                  {i + 1}
                </span>
              ) : null}
              {colors ? (
                <i
                  className="fg-apl-tone"
                  aria-hidden="true"
                  style={{ background: participantTone(i) }}
                />
              ) : null}
              <Avatar name={p.name} size={24} />
              <span className="fg-apl-who">
                <span className="fg-apl-name">{p.name}</span>
                <span className="fg-apl-sub">
                  {[p.role, p.email].filter(Boolean).join(" · ") || " "}
                </span>
              </span>
              {p.at && status && (status === "approved" || status === "rejected") ? (
                <span className="fg-apl-when">{formatStamp(p.at)}</span>
              ) : null}
              {status && mark ? (
                <Badge tone={mark.tone} dot={status === "current"}>
                  {names[status]}
                </Badge>
              ) : null}
              {onRemind && status === "current" ? (
                <IconButton
                  icon={Notification01Icon}
                  size="sm"
                  label={`Remind ${p.name}`}
                  onClick={() => onRemind(p)}
                />
              ) : null}
              {actions?.(p, i)}
              {canRemove ? (
                <IconButton
                  icon={Cancel01Icon}
                  size="sm"
                  label={`Remove ${p.name}`}
                  onClick={() => remove(i)}
                />
              ) : null}
            </li>
          );
        })}
      </ol>
      <p className="fg-sr" role="status" aria-live="polite">
        {sortable.status}
      </p>
    </div>
  );
}
