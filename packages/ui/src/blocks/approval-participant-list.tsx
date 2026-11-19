// The people of an approval, in order: name, role, status, and, when the list is editable, a
// reorder by drag or by Alt + the arrow keys, and a remove. One row is the tab stop; the arrows
// move between rows. Every move is said in a live region.

import { Cancel01Icon, Drag02Icon, Notification01Icon } from "@forgeron/icons";
import type { DragEvent, KeyboardEvent, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "../avatar";
import { Badge } from "../badge";
import { cx } from "../cx";
import { useControllableState } from "../hooks/use-controllable";
import { Icon } from "../icon";
import { IconButton } from "../identity";
import {
  APPROVAL_STATUS_MARKS,
  APPROVAL_STATUS_NAMES,
  moveItem,
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
  const [said, setSaid] = useState("");
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const list = useRef<HTMLOListElement>(null);
  const focusId = useRef<string | null>(null);
  const tab = Math.min(active, Math.max(people.length - 1, 0));

  // After a move or a removal, the focus follows the row.
  useEffect(() => {
    const id = focusId.current;
    if (!id) return;
    focusId.current = null;
    list.current?.querySelector<HTMLElement>(`[data-pid="${CSS.escape(id)}"]`)?.focus();
  });

  const move = (from: number, to: number) => {
    if (to < 0 || to >= people.length || from === to) return;
    const person = people[from]!;
    setPeople(moveItem(people, from, to));
    setActive(to);
    focusId.current = person.id;
    setSaid(`${person.name} moved to position ${to + 1} of ${people.length}.`);
  };

  const remove = (index: number) => {
    const person = people[index]!;
    const next = people.filter((_, i) => i !== index);
    setPeople(next);
    const neighbour = next[Math.min(index, next.length - 1)];
    focusId.current = neighbour?.id ?? null;
    setActive(Math.min(index, Math.max(next.length - 1, 0)));
    setSaid(`${person.name} removed.`);
  };

  const onKey = (event: KeyboardEvent<HTMLLIElement>, index: number) => {
    if (event.target !== event.currentTarget) return;
    const { key } = event;
    if (key === "ArrowUp" || key === "ArrowDown") {
      event.preventDefault();
      const to = index + (key === "ArrowDown" ? 1 : -1);
      if (event.altKey) {
        if (canMove) move(index, to);
      } else if (to >= 0 && to < people.length) {
        setActive(to);
        list.current
          ?.querySelector<HTMLElement>(`[data-pid="${CSS.escape(people[to]!.id)}"]`)
          ?.focus();
      }
    } else if (key === "Home" || key === "End") {
      event.preventDefault();
      const to = key === "Home" ? 0 : people.length - 1;
      if (event.altKey && canMove) move(index, to);
      else {
        setActive(to);
        list.current
          ?.querySelector<HTMLElement>(`[data-pid="${CSS.escape(people[to]!.id)}"]`)
          ?.focus();
      }
    } else if ((key === "Delete" || key === "Backspace") && canRemove) {
      event.preventDefault();
      remove(index);
    }
  };

  const onDrop = (event: DragEvent, to: number) => {
    event.preventDefault();
    if (dragFrom !== null) move(dragFrom, to);
    setDragFrom(null);
    setDragOver(null);
  };

  if (people.length === 0) {
    return <p className={cx("fg-apl-empty", className)}>{empty}</p>;
  }

  return (
    <div className={cx("fg-apl", className)}>
      <ol ref={list} className="fg-apl-list" aria-label={label}>
        {people.map((p, i) => {
          const status = p.status;
          const mark = status ? APPROVAL_STATUS_MARKS[status] : null;
          return (
            <li
              key={p.id}
              data-pid={p.id}
              tabIndex={i === tab ? 0 : -1}
              className={cx(
                "fg-apl-row",
                dragFrom === i && "fg-apl-dragging",
                dragOver === i && dragFrom !== i && "fg-apl-over",
              )}
              aria-label={`${p.name}${p.role ? `, ${p.role}` : ""}${
                status ? `, ${names[status]}` : ""
              }, ${i + 1} of ${people.length}`}
              aria-description={
                canMove ? "Alt and the up or down arrow moves this person." : undefined
              }
              draggable={canMove}
              onFocus={(e) => {
                if (e.target === e.currentTarget) setActive(i);
              }}
              onKeyDown={(e) => onKey(e, i)}
              onDragStart={(e) => {
                setDragFrom(i);
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("text/plain", p.id);
              }}
              onDragOver={(e) => {
                if (dragFrom === null) return;
                e.preventDefault();
                setDragOver(i);
              }}
              onDrop={(e) => onDrop(e, i)}
              onDragEnd={() => {
                setDragFrom(null);
                setDragOver(null);
              }}
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
        {said}
      </p>
    </div>
  );
}
