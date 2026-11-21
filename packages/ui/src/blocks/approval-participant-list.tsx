// The people of an approval, in order: name, role, status, and, when the list is editable, a
// reorder by drag or by Alt + the arrow keys, and a remove. One row is the tab stop; the arrows
// move between rows. Every move is said in a live region.
//
// With `value` it is the usual list. With children it is a frame, and the parts compose it:
//
//   <ParticipantList label="Signers" value={people} onChange={setPeople} editable>
//     <ParticipantListRows
//       renderItem={(person, index) => (
//         <ParticipantListItem person={person} index={index}>
//           <ParticipantListGrip /><ParticipantListOrder /><ParticipantListWho />
//           <ParticipantListBadge /><ParticipantListRemove />
//         </ParticipantListItem>
//       )}
//     />
//     <ParticipantListLive />
//   </ParticipantList>

import { Cancel01Icon, Drag02Icon, Notification01Icon } from "@forgeron/icons";
import type { KeyboardEvent, ReactNode } from "react";
import { createContext, Fragment, useContext, useState } from "react";
import { Avatar } from "../avatar";
import { Badge } from "../badge";
import { cx } from "../cx";
import { useControllableState } from "../hooks/use-controllable";
import { Icon } from "../icon";
import { IconButton } from "../identity";
import { useSortable, type SortableApi } from "../sortable";
import {
  APPROVAL_STATUS_MARKS,
  APPROVAL_STATUS_NAMES,
  participantTone,
  type ApprovalParticipant,
  type ApprovalStatus,
  formatStamp,
} from "./approval-model";
import { part, type PartProps } from "../part";

interface ListContext {
  people: ReadonlyArray<ApprovalParticipant>;
  canMove: boolean;
  canRemove: boolean;
  ordered: boolean;
  colors: boolean;
  names: Record<ApprovalStatus, string>;
  tab: number;
  setActive: (index: number) => void;
  sortable: SortableApi;
  remove: (index: number) => void;
  onRemind: ((person: ApprovalParticipant) => void) | undefined;
  actions: ((person: ApprovalParticipant, index: number) => ReactNode) | undefined;
}
const ListCtx = createContext<ListContext | null>(null);
const ItemCtx = createContext<{ person: ApprovalParticipant; index: number } | null>(null);

function useList(name: string): ListContext {
  const ctx = useContext(ListCtx);
  if (!ctx) throw new Error(`<${name}> goes inside a <ParticipantList>.`);
  return ctx;
}
function useItem(name: string): { person: ApprovalParticipant; index: number } {
  const ctx = useContext(ItemCtx);
  if (!ctx) throw new Error(`<${name}> goes inside a <ParticipantListItem>.`);
  return ctx;
}

/* ---------------------------------------------------------------- parts */

/** The row of a person: a sortable item, one of them the tab stop. Without children, the usual parts. */
export function ParticipantListItem({
  person,
  index,
  children,
  ...rest
}: Omit<PartProps<"li">, "children"> & {
  person: ApprovalParticipant;
  index: number;
  children?: ReactNode;
}) {
  const { people, canMove, canRemove, names, tab, setActive, sortable, remove } =
    useList("ParticipantListItem");
  const status = person.status;
  const onKey = (event: KeyboardEvent<HTMLLIElement>) => {
    if (event.target !== event.currentTarget) return;
    if ((event.key === "Delete" || event.key === "Backspace") && canRemove) {
      event.preventDefault();
      remove(index);
    }
  };
  const state = sortable.getItemState(person.id);
  const itemProps = sortable.getItemProps(person.id, {
    tabIndex: index === tab ? 0 : -1,
    "aria-label": `${person.name}${person.role ? `, ${person.role}` : ""}${
      status ? `, ${names[status]}` : ""
    }, ${index + 1} of ${people.length}`,
    "aria-description": canMove ? "Alt and the up or down arrow moves this person." : undefined,
    onFocus: (e) => {
      if (e.target === e.currentTarget) setActive(index);
    },
    onKeyDown: (e) => onKey(e as KeyboardEvent<HTMLLIElement>),
  });
  return (
    <ItemCtx.Provider value={{ person, index }}>
      {part(
        "li",
        "participant-list-item",
        cx("fg-apl-row", state.dragging && "fg-apl-dragging", state.over && "fg-apl-over"),
        {
          ...rest,
          children: children ?? (
            <>
              {canMove ? <ParticipantListGrip /> : null}
              <ParticipantListOrder />
              <ParticipantListTone />
              <ParticipantListWho />
              <ParticipantListWhen />
              <ParticipantListBadge />
              <ParticipantListRemind />
              <ParticipantListActions />
              <ParticipantListRemove />
            </>
          ),
        },
        { ...(itemProps as object), "data-pid": person.id },
      )}
    </ItemCtx.Provider>
  );
}

/** The handle that shows the row can be dragged. */
export function ParticipantListGrip({ children, ...rest }: PartProps<"span">) {
  return part(
    "span",
    "participant-list-grip",
    "fg-apl-grip",
    { ...rest, children: children ?? <Icon icon={Drag02Icon} size={12} variant="mono" /> },
    { "aria-hidden": "true" },
  );
}

/** The number of the person in the order they act in; only when the list is `ordered`. */
export function ParticipantListOrder({ children, ...rest }: PartProps<"span">) {
  const { ordered } = useList("ParticipantListOrder");
  const { index } = useItem("ParticipantListOrder");
  if (!ordered) return null;
  return part(
    "span",
    "participant-list-order",
    "fg-apl-order",
    { ...rest, children: children ?? index + 1 },
    { "aria-hidden": "true" },
  );
}

/** A square of the person's colour; only when the list has `colors`. */
export function ParticipantListTone({ style, ...rest }: PartProps<"i">) {
  const { colors } = useList("ParticipantListTone");
  const { index } = useItem("ParticipantListTone");
  if (!colors) return null;
  return part(
    "i",
    "participant-list-tone",
    "fg-apl-tone",
    { ...rest, style: { background: participantTone(index), ...style } },
    { "aria-hidden": "true" },
  );
}

/** The avatar, the name and the role or email under it. */
export function ParticipantListWho({ children, ...rest }: PartProps<"span">) {
  const { person } = useItem("ParticipantListWho");
  return (
    <>
      <Avatar name={person.name} size={24} />
      {part("span", "participant-list-who", "fg-apl-who", {
        ...rest,
        children: children ?? (
          <>
            <span className="fg-apl-name">{person.name}</span>
            <span className="fg-apl-sub">
              {[person.role, person.email].filter(Boolean).join(" · ") || " "}
            </span>
          </>
        ),
      })}
    </>
  );
}

/** When they approved or rejected. */
export function ParticipantListWhen({ children, ...rest }: PartProps<"span">) {
  const { person } = useItem("ParticipantListWhen");
  const status = person.status;
  if (!person.at || !status || (status !== "approved" && status !== "rejected")) return null;
  return part("span", "participant-list-when", "fg-apl-when", {
    ...rest,
    children: children ?? formatStamp(person.at),
  });
}

/** The status of the person, as a badge. */
export function ParticipantListBadge({ children }: { children?: ReactNode }) {
  const { names } = useList("ParticipantListBadge");
  const { person } = useItem("ParticipantListBadge");
  const status = person.status;
  if (!status) return null;
  const mark = APPROVAL_STATUS_MARKS[status];
  return (
    <Badge tone={mark.tone} dot={status === "current"}>
      {children ?? names[status]}
    </Badge>
  );
}

/** Reminds whoever is current; shown when the list has `onRemind`. */
export function ParticipantListRemind() {
  const { onRemind } = useList("ParticipantListRemind");
  const { person } = useItem("ParticipantListRemind");
  if (!onRemind || person.status !== "current") return null;
  return (
    <IconButton
      data-slot="participant-list-remind"
      icon={Notification01Icon}
      size="sm"
      label={`Remind ${person.name}`}
      onClick={() => onRemind(person)}
    />
  );
}

/** What the list's `actions` adds at the end of the row. */
export function ParticipantListActions() {
  const { actions } = useList("ParticipantListActions");
  const { person, index } = useItem("ParticipantListActions");
  return <>{actions?.(person, index)}</>;
}

/** Takes the person out; shown when the list can be edited. */
export function ParticipantListRemove() {
  const { canRemove, remove } = useList("ParticipantListRemove");
  const { person, index } = useItem("ParticipantListRemove");
  if (!canRemove) return null;
  return (
    <IconButton
      data-slot="participant-list-remove"
      icon={Cancel01Icon}
      size="sm"
      label={`Remove ${person.name}`}
      onClick={() => remove(index)}
    />
  );
}

/** The ordered list of rows; `renderItem` draws a row your way. */
export function ParticipantListRows({
  renderItem,
  ...rest
}: Omit<PartProps<"ol">, "children"> & {
  renderItem?: (person: ApprovalParticipant, index: number) => ReactNode;
}) {
  const { people, sortable } = useList("ParticipantListRows");
  return part(
    "ol",
    "participant-list-rows",
    "fg-apl-list",
    {
      ...rest,
      children: people.map((p, i) => (
        <Fragment key={p.id}>
          {renderItem ? renderItem(p, i) : <ParticipantListItem person={p} index={i} />}
        </Fragment>
      )),
    },
    sortable.getListProps({}) as Record<string, unknown>,
  );
}

/** The polite line that says every move. */
export function ParticipantListLive(props: PartProps<"p">) {
  const { sortable } = useList("ParticipantListLive");
  return part(
    "p",
    "participant-list-live",
    "fg-sr",
    { ...props, children: props.children ?? sortable.status },
    { role: "status", "aria-live": "polite" },
  );
}

/* ---------------------------------------------------------------- the list */

export interface ParticipantListProps extends Omit<
  PartProps<"div">,
  "children" | "onChange" | "defaultValue"
> {
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
  /** The parts (`ParticipantListRows`, `ParticipantListLive`). Without them, the list is built from the props. */
  children?: ReactNode;
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
  children,
  className,
  asChild,
  ...rest
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

  if (people.length === 0) {
    return part("p", "participant-list", "fg-apl-empty", {
      className,
      ...(rest as PartProps<"p">),
      children: empty,
    });
  }

  return (
    <ListCtx.Provider
      value={{
        people,
        canMove,
        canRemove,
        ordered,
        colors,
        names,
        tab,
        setActive,
        sortable,
        remove,
        onRemind,
        actions,
      }}
    >
      {part("div", "participant-list", "fg-apl", {
        className,
        asChild,
        ...rest,
        children: children ?? (
          <>
            <ParticipantListRows />
            <ParticipantListLive />
          </>
        ),
      })}
    </ListCtx.Provider>
  );
}
