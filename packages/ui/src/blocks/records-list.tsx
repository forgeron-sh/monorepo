// Records in groups, folded or open, one dense row each, whatever the records are: the rows draw
// the fields shown (records-model), so an issue, a project and an invoice share this list. The
// arrows move between rows, Enter opens one; with `selectionMode="multiple"` a selection and its bar.
//
// With no children, `RecordList` draws every group of `groups`. With children it is the root of its
// parts: it keeps the state (the current row, the selection, the folded groups, editing in place)
// and the arrows, and its children lay the groups out:
//
//   <RecordList fields={issueFields} groups={groups} onAdd={add}>
//     {groups.map((group) => (
//       <RecordListGroup key={group.key} group={group}>
//         <RecordListHeader>
//           <RecordListToggle />
//           <RecordListAdd />
//         </RecordListHeader>
//         <RecordListRows>
//           {group.records.map((record) => (
//             <RecordListRow key={record.id} record={record} />
//           ))}
//         </RecordListRows>
//       </RecordListGroup>
//     ))}
//   </RecordList>

import { ArrowDown01Icon, Calendar03Icon, PlusSignIcon } from "@forgeron/icons";
import {
  createContext,
  useContext,
  useId,
  type ComponentProps,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { cx } from "../cx";
import { Icon } from "../icon";
import { IconButton } from "../identity";
import {
  SelectionBar,
  SelectionBarClear,
  SelectionBarCount,
  SelectionBarSeparator,
} from "../selection-bar";
import { renderPart } from "../part";
import { isMenuKey, RowMenuArea, RowMore } from "./lists-editing";
import { RecordFieldMark, hasPicker, type RecordGroup } from "./records-fields";
import {
  RecordFieldSlot,
  RecordSurfaceContext,
  splitSurface,
  useRecordSurface,
  type RecordItem,
  type RecordSurfaceProps,
  type Surface,
} from "./records-surface";

/** The kinds whose cell is a list of chips: nothing is drawn when they are empty. */
const HIDE_WHEN_EMPTY: ReadonlySet<string> = new Set(["labels", "people", "relation", "file"]);

export interface RecordListProps<R extends RecordItem>
  extends RecordSurfaceProps<R>, Omit<HTMLAttributes<HTMLDivElement>, keyof RecordSurfaceProps<R>> {
  /** The groups in order: `recordGroups(fields, records, "status")`, or `useRecordView().groups`. */
  groups: ReadonlyArray<RecordGroup<R>>;
  /** Shows a group with no record; hidden by default. */
  showEmptyGroups?: boolean;
  /** Adds a + at the end of each group's header. */
  onAdd?: (groupKey: string) => void;
  /** What a record is called, in "New issue in Todo" and in the empty message. */
  noun?: string;
  /** Shown when no group has a record. */
  empty?: ReactNode;
  /** The bar over the list while records are selected: the actions on `ids`. */
  selectionActions?: (ids: string[]) => ReactNode;
  /** Draws a row yourself; it still gets the group, the arrows and the selection. */
  renderRow?: (record: R, surface: Surface<R>) => ReactNode;
  /** The parts (`RecordListGroup`…) in place of the groups drawn from `groups`. */
  children?: ReactNode;
}

interface ListContextValue<R extends RecordItem> {
  surface: Surface<R>;
  noun: string;
  showCounts: boolean;
  onAdd: ((groupKey: string) => void) | undefined;
  renderRow: ((record: R, surface: Surface<R>) => ReactNode) | undefined;
}

interface GroupContextValue {
  group: RecordGroup<RecordItem>;
  /** The id of the rows' list: what the toggle controls. */
  bodyId: string;
}

const ListContext = createContext<ListContextValue<RecordItem> | null>(null);
const GroupContext = createContext<GroupContextValue | null>(null);

/** What the list's options say: its surface, its noun and handlers. For parts of your own. */
export function useRecordList<R extends RecordItem = RecordItem>(
  part = "a list part",
): ListContextValue<R> {
  const ctx = useContext(ListContext);
  if (!ctx) throw new Error(`<${part}> goes inside a <RecordList>.`);
  return ctx as unknown as ListContextValue<R>;
}

/** The group the part sits in. */
export function useRecordListGroup<R extends RecordItem = RecordItem>(
  part = "a list part",
): { group: RecordGroup<R>; bodyId: string } {
  const ctx = useContext(GroupContext);
  if (!ctx) throw new Error(`<${part}> goes inside a <RecordListGroup>.`);
  return ctx as unknown as { group: RecordGroup<R>; bodyId: string };
}

/** The class of the button a field's mark becomes when it can be edited. */
const slotClass = (kind: string) =>
  kind === "labels" ? "fg-issue-chips" : kind === "date" ? "fg-issue-date" : "fg-issue-hit";

/** Records in groups, one dense row each. */
export function RecordList<R extends RecordItem>({
  groups,
  showEmptyGroups = false,
  onAdd,
  noun = "record",
  empty = `No ${noun}s here yet`,
  selectionActions,
  renderRow,
  children,
  ...others
}: RecordListProps<R>) {
  const [surfaceProps, { showCounts = false, label = "Records", className, ...rest }] =
    splitSurface<R, typeof others>(others);
  const shown = groups.filter((g) => showEmptyGroups || g.records.length > 0);
  const surface = useRecordSurface(surfaceProps, shown);
  const { collection, openMenu, attr } = surface;

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    (rest.onKeyDown as ((e: KeyboardEvent<HTMLElement>) => void) | undefined)?.(event);
    if (!isMenuKey(event)) return;
    const row = (event.target as HTMLElement).closest<HTMLElement>(`[${attr}]`);
    if (!row) return;
    event.preventDefault();
    const id = row.getAttribute(attr)!;
    collection.select(id);
    openMenu(id);
  };

  if (!groups.some((g) => g.records.length > 0) && !showEmptyGroups) {
    return (
      <div data-slot="record-list-empty" className={cx("fg-ilist-empty", className)}>
        {empty}
      </div>
    );
  }

  const value: ListContextValue<R> = { surface, noun, showCounts, onAdd, renderRow };
  const list = (
    <RecordSurfaceContext value={surface as unknown as Surface<RecordItem>}>
      <ListContext value={value as unknown as ListContextValue<RecordItem>}>
        <div
          {...surface.rootProps({
            ...rest,
            className: cx("fg-ilist", className),
            role: "region",
            "aria-label": label,
            onKeyDown,
          })}
          data-slot="record-list"
        >
          {children ?? shown.map((group) => <RecordListGroup key={group.key} group={group} />)}
        </div>
      </ListContext>
    </RecordSurfaceContext>
  );
  if (!selectionActions || !surface.multiple) return list;
  return (
    <>
      <SelectionBar count={collection.selected.length} onClear={collection.clear}>
        <SelectionBarClear />
        <SelectionBarCount />
        <SelectionBarSeparator />
        {selectionActions(collection.selected)}
      </SelectionBar>
      {list}
    </>
  );
}

/* ---------------------------------------------------------------- the parts */

export interface RecordListGroupProps<R extends RecordItem> extends Omit<
  ComponentProps<"section">,
  "children"
> {
  group: RecordGroup<R>;
  asChild?: boolean;
  /** The header and the rows by default. */
  children?: ReactNode;
}

/** One group of rows: a header, folded or open, and its rows. */
export function RecordListGroup<R extends RecordItem>({
  group,
  asChild,
  className,
  children,
  ...rest
}: RecordListGroupProps<R>) {
  const bodyId = `${useId()}-${group.key}`;
  return (
    <GroupContext value={{ group: group as unknown as RecordGroup<RecordItem>, bodyId }}>
      {renderPart("section", cx("fg-ilist-group", className), asChild, {
        "data-slot": "record-list-group",
        "aria-label": group.name,
        ...rest,
        children: children ?? (
          <>
            <RecordListHeader />
            <RecordListRows />
          </>
        ),
      })}
    </GroupContext>
  );
}

export interface RecordListHeaderProps extends Omit<ComponentProps<"div">, "children"> {
  asChild?: boolean;
  /** The toggle and the add button by default. */
  children?: ReactNode;
}

/** The header of a group. */
export function RecordListHeader({ asChild, className, children, ...rest }: RecordListHeaderProps) {
  return renderPart("div", cx("fg-ilist-head", className), asChild, {
    "data-slot": "record-list-header",
    ...rest,
    children: children ?? (
      <>
        <RecordListToggle />
        <RecordListAdd />
      </>
    ),
  });
}

export interface RecordListToggleProps extends ComponentProps<"button"> {
  asChild?: boolean;
}

/** The button that folds a group and opens it: a chevron, the group's mark, its name, its count. */
export function RecordListToggle({ asChild, className, children, ...rest }: RecordListToggleProps) {
  const { surface, showCounts } = useRecordList("RecordListToggle");
  const { group, bodyId } = useRecordListGroup("RecordListToggle");
  return renderPart("button", cx("fg-ilist-toggle", className), asChild, {
    type: "button",
    "data-slot": "record-list-toggle",
    "aria-expanded": !surface.folded.has(group.key),
    "aria-controls": bodyId,
    onClick: () => surface.toggle(group.key),
    ...rest,
    children: children ?? (
      <>
        <Icon icon={ArrowDown01Icon} size={12} variant="mono" className="fg-ilist-chevron" />
        {group.glyph}
        <span className="fg-ilist-name">{group.name}</span>
        {showCounts ? <span className="fg-ilist-count">{group.records.length}</span> : null}
      </>
    ),
  });
}

/** The + at the end of a group's header, when the list has an `onAdd`. */
export function RecordListAdd({
  label,
  className,
  onClick,
  ...rest
}: Omit<ComponentProps<"button">, "children" | "label"> & { label?: string }) {
  const { onAdd, noun } = useRecordList("RecordListAdd");
  const { group } = useRecordListGroup("RecordListAdd");
  if (!onAdd) return null;
  return (
    <IconButton
      icon={PlusSignIcon}
      size="sm"
      label={label ?? `New ${noun} in ${group.name}`}
      data-slot="record-list-add"
      {...rest}
      {...(className ? { className } : {})}
      onClick={(event) => {
        onClick?.(event);
        onAdd(group.key);
      }}
    />
  );
}

export interface RecordListRowsProps extends Omit<ComponentProps<"ul">, "children"> {
  asChild?: boolean;
  /** A row per record of the group by default. Nothing is drawn while the group is folded. */
  children?: ReactNode;
}

/** The rows of a group. */
export function RecordListRows({ asChild, className, children, ...rest }: RecordListRowsProps) {
  const { surface } = useRecordList("RecordListRows");
  const { group, bodyId } = useRecordListGroup("RecordListRows");
  if (surface.folded.has(group.key)) return null;
  return renderPart("ul", cx("fg-ilist-rows", className), asChild, {
    id: bodyId,
    "data-slot": "record-list-rows",
    ...rest,
    children:
      children ?? group.records.map((record) => <RecordListRow key={record.id} record={record} />),
  });
}

export interface RecordListRowProps<R extends RecordItem> extends Omit<
  ComponentProps<"li">,
  "children"
> {
  record: R;
  /**
   * With `asChild`, the child element is the `<li>` itself and the menu area and the row are
   * yours. Else the row's content, `RecordRow` by default.
   */
  asChild?: boolean;
  children?: ReactNode;
}

/** A row in its group: its row menu (right click) around the `RecordRow`. */
export function RecordListRow<R extends RecordItem>({
  record,
  asChild,
  className,
  children,
  ...rest
}: RecordListRowProps<R>) {
  const { surface, renderRow } = useRecordList<R>("RecordListRow");
  return renderPart("li", className, asChild, {
    "data-slot": "record-list-row",
    ...rest,
    children: asChild ? (
      children
    ) : (
      <RowMenuArea {...surface.menu(record)}>
        {children ?? (renderRow ? renderRow(record, surface) : <RecordRow record={record} />)}
      </RowMenuArea>
    ),
  });
}

export interface RecordRowProps<R extends RecordItem> extends Omit<
  ComponentProps<"div">,
  "children"
> {
  record: R;
  /** The list's surface, when the row is drawn outside a `RecordList` (a `renderRow`). */
  surface?: Surface<R>;
  menuOpen?: { open: boolean; onOpenChange: (open: boolean) => void };
}

/** A row: the lead fields, the title, then the trailing fields, each one its own picker. */
export function RecordRow<R extends RecordItem>({
  record,
  surface: given,
  menuOpen: menuState,
  className,
  ...rest
}: RecordRowProps<R>) {
  const inherited = useContext(RecordSurfaceContext) as unknown as Surface<R> | null;
  const surface = given ?? inherited;
  if (!surface) throw new Error("<RecordRow> goes inside a <RecordList>, or takes a `surface`.");
  const menuOpen = menuState ?? surface.menuOpen(record.id);
  const { fields, context, edit, menu } = surface;
  const shown = fields.keys.filter((k) => k !== surface.titleField && surface.shows(k));
  const field = (name: string) => {
    const def = fields.def(name);
    const empty = fields.isEmpty(record, name);
    if (HIDE_WHEN_EMPTY.has(def.kind) && empty) return null;
    const mark =
      def.kind === "date" && empty && edit && hasPicker(def.kind) ? (
        <span className="fg-ilist-due fg-issue-ghost">
          <Icon icon={Calendar03Icon} size={12} variant="mono" />
          <span className="fg-sr">No {def.label.toLowerCase()}</span>
        </span>
      ) : (
        <RecordFieldMark fields={fields} name={name} record={record} context={context} view="row" />
      );
    return (
      <RecordFieldSlot
        key={name}
        surface={surface}
        record={record}
        name={name}
        className={slotClass(def.kind)}
      >
        {mark}
      </RecordFieldSlot>
    );
  };
  const place = (name: string) => fields.def(name).place?.row ?? "trail";
  const content = (
    <>
      {shown.filter((k) => place(k) === "lead").map(field)}
      <span className="fg-ilist-title">{fields.text(record, surface.titleField, context)}</span>
      <span className="fg-ilist-trail">
        {shown.filter((k) => place(k) === "trail").map(field)}
        <RowMore {...menu(record)} {...menuOpen} />
      </span>
      {shown
        .filter((k) => HIDE_WHEN_EMPTY.has(fields.def(k).kind) && fields.isEmpty(record, k))
        .map((k) => (
          <RecordFieldSlot key={k} surface={surface} record={record} name={k} unset>
            {null}
          </RecordFieldSlot>
        ))}
    </>
  );
  const props = {
    "data-slot": "record-row",
    ...rest,
    className: cx(
      "fg-ilist-row",
      surface.collection.isSelected(record.id) && "fg-ilist-current",
      className,
    ),
    ...surface.itemProps(record),
  };
  if (!surface.interactive) {
    return (
      <button type="button" {...(props as ComponentProps<"button">)}>
        {content}
      </button>
    );
  }
  // The row holds the pickers' triggers: a focusable group (a button cannot hold buttons).
  return (
    <div
      {...props}
      role="group"
      aria-label={`${record.id} ${fields.text(record, surface.titleField, context)}`}
    >
      {content}
    </div>
  );
}
