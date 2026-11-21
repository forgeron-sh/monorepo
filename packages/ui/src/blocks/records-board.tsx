// Records as cards in columns, whatever the records are: the columns are the values of a groupable
// field (`recordGroups`), the cards draw the fields shown. Layout only: moving a card is the
// caller's, through its own menus or shortcuts (`onRecordChange` with a patch from `fields.patch`).
//
// With no children, `RecordBoard` draws every column of `columns`. With children it is the root of
// its parts, on the `Board` parts (board.tsx): it keeps the state (the current card, the folded
// columns, editing in place) and the arrows, and its children lay the columns out:
//
//   <RecordBoard fields={issueFields} columns={columns} onAdd={add}>
//     {columns.map((column) => (
//       <RecordBoardColumn key={column.key} column={column}>
//         <RecordBoardColumnHeader>
//           <RecordBoardColumnToggle />
//           <RecordBoardColumnActions />
//         </RecordBoardColumnHeader>
//         <RecordBoardCards>
//           {column.records.map((record) => (
//             <RecordBoardCard key={record.id} record={record} />
//           ))}
//           <RecordBoardAdd />
//         </RecordBoardCards>
//       </RecordBoardColumn>
//     ))}
//   </RecordBoard>

import { MoreHorizontalIcon, PlusSignIcon } from "@forgeron/icons";
import {
  createContext,
  useContext,
  type ComponentProps,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { Board, BoardCard, BoardCards, BoardColumn, BoardColumnHeader } from "../board";
import { cx } from "../cx";
import { Icon } from "../icon";
import { IconButton } from "../identity";
import { isMenuKey, RowMenuArea, RowMore } from "./lists-editing";
import { RecordFieldMark, type RecordGroup } from "./records-fields";
import type { RecordFieldDef } from "./records-model";
import { primitivePart, renderPart } from "../part";
import {
  RecordFieldSlot,
  RecordSurfaceContext,
  splitSurface,
  useRecordSurface,
  type RecordItem,
  type RecordSurfaceProps,
  type Surface,
} from "./records-surface";

export interface RecordBoardProps<R extends RecordItem>
  extends RecordSurfaceProps<R>, Omit<HTMLAttributes<HTMLDivElement>, keyof RecordSurfaceProps<R>> {
  /** The columns, in order. */
  columns: ReadonlyArray<RecordGroup<R>>;
  /** Adds a + to each column's header and a "New …" button at the end of its lane. */
  onAdd?: (columnKey: string) => void;
  /** Adds a ⋯ to each column's header. */
  onColumnMenu?: (columnKey: string) => void;
  /** What a record is called, in "New issue in Todo". */
  noun?: string;
  /** Extra content at the end of a card (a project chip, an estimate). */
  renderExtra?: (record: R) => ReactNode;
  /** Draws a card yourself; it still gets the lanes, the arrows and the selection. */
  renderCard?: (record: R, surface: Surface<R>) => ReactNode;
  /** The parts (`RecordBoardColumn`…) in place of the columns drawn from `columns`. */
  children?: ReactNode;
}

interface BoardContextValue<R extends RecordItem> {
  surface: Surface<R>;
  noun: string;
  showCounts: boolean;
  onAdd: ((columnKey: string) => void) | undefined;
  onColumnMenu: ((columnKey: string) => void) | undefined;
  renderExtra: ((record: R) => ReactNode) | undefined;
  renderCard: ((record: R, surface: Surface<R>) => ReactNode) | undefined;
}

const BoardContext = createContext<BoardContextValue<RecordItem> | null>(null);
const ColumnContext = createContext<RecordGroup<RecordItem> | null>(null);

/** What the board's options say: its surface, its noun and handlers. For parts of your own. */
export function useRecordBoard<R extends RecordItem = RecordItem>(
  part = "a board part",
): BoardContextValue<R> {
  const ctx = useContext(BoardContext);
  if (!ctx) throw new Error(`<${part}> goes inside a <RecordBoard>.`);
  return ctx as unknown as BoardContextValue<R>;
}

/** The column the part sits in. */
export function useRecordBoardColumn<R extends RecordItem = RecordItem>(
  part = "a board part",
): RecordGroup<R> {
  const column = useContext(ColumnContext);
  if (!column) throw new Error(`<${part}> goes inside a <RecordBoardColumn>.`);
  return column as unknown as RecordGroup<R>;
}

/** The class of the button a field's mark becomes when it can be edited. */
const slotClass = (def: RecordFieldDef<never>) =>
  def.kind === "date"
    ? "fg-issue-date"
    : (def.place?.card ?? "chips") === "chips"
      ? "fg-issue-chips"
      : "fg-issue-hit";

/** Records as cards in columns: the board layout of the Tasks app. */
export function RecordBoard<R extends RecordItem>({
  columns,
  onAdd,
  onColumnMenu,
  noun = "record",
  renderExtra,
  renderCard,
  children,
  ...others
}: RecordBoardProps<R>) {
  const [surfaceProps, { showCounts = false, label = "Board", className, ...rest }] = splitSurface<
    R,
    typeof others
  >(others);
  const surface = useRecordSurface(surfaceProps, columns);
  const { collection, folded, openMenu, attr } = surface;

  // Up and down inside a lane, left and right to the same rank of the next open lane. `useCollection`
  // in grid orientation reads rows from the page, which a board has not (lanes of different heights);
  // so the keys are a small map over the columns' data, and the collection keeps the focus and the
  // selection (and Home and End, which it handles in the flat order).
  const lanes = columns.filter((c) => !folded.has(c.key) && c.records.length > 0);
  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    (rest.onKeyDown as ((e: KeyboardEvent<HTMLElement>) => void) | undefined)?.(event);
    const card = (event.target as HTMLElement).closest<HTMLElement>(`[${attr}]`);
    if (!card) return;
    const id = card.getAttribute(attr)!;
    if (isMenuKey(event)) {
      event.preventDefault();
      collection.select(id);
      openMenu(id);
      return;
    }
    const col = lanes.findIndex((lane) => lane.records.some((r) => r.id === id));
    const lane = lanes[col]?.records;
    if (!lane) return;
    const rank = lane.findIndex((r) => r.id === id);
    let next: string | undefined;
    if (event.key === "ArrowDown") next = lane[rank + 1]?.id;
    else if (event.key === "ArrowUp") next = lane[rank - 1]?.id;
    else if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      const other = lanes[col + (event.key === "ArrowRight" ? 1 : -1)]?.records;
      next = other?.[Math.min(rank, other.length - 1)]?.id;
    } else return;
    event.preventDefault();
    if (!next) return;
    collection.focus(next);
    collection.select(next);
  };

  const value: BoardContextValue<R> = {
    surface,
    noun,
    showCounts,
    onAdd,
    onColumnMenu,
    renderExtra,
    renderCard,
  };
  return (
    <RecordSurfaceContext value={surface as unknown as Surface<RecordItem>}>
      <BoardContext value={value as unknown as BoardContextValue<RecordItem>}>
        <Board
          {...surface.rootProps({
            ...rest,
            className: cx("fg-iboard", className),
            role: "region",
            "aria-label": label,
            onKeyDown,
          })}
          data-slot="record-board"
        >
          {children ??
            columns.map((column) => <RecordBoardColumn key={column.key} column={column} />)}
        </Board>
      </BoardContext>
    </RecordSurfaceContext>
  );
}

/* ---------------------------------------------------------------- the parts */

export interface RecordBoardColumnProps<R extends RecordItem> extends Omit<
  ComponentProps<"section">,
  "children"
> {
  column: RecordGroup<R>;
  asChild?: boolean;
  /** The header and the lane by default. */
  children?: ReactNode;
}

/** One column, folded or open: its header then its lane. */
export function RecordBoardColumn<R extends RecordItem>({
  column,
  asChild,
  className,
  children,
  ...rest
}: RecordBoardColumnProps<R>) {
  const { surface } = useRecordBoard<R>("RecordBoardColumn");
  const folded = surface.folded.has(column.key);
  return (
    <ColumnContext value={column as unknown as RecordGroup<RecordItem>}>
      {primitivePart(
        BoardColumn,
        "section",
        "fg-board-col",
        asChild,
        cx("fg-iboard-col", folded && "fg-iboard-folded", className),
        {
          "data-slot": "record-board-column",
          "aria-label": column.name,
          ...rest,
          children: children ?? (
            <>
              <RecordBoardColumnHeader />
              <RecordBoardCards />
            </>
          ),
        },
      )}
    </ColumnContext>
  );
}

export interface RecordBoardColumnHeaderProps extends Omit<ComponentProps<"h2">, "children"> {
  asChild?: boolean;
  /** The toggle, and the actions when the column is open, by default. */
  children?: ReactNode;
}

/** The header of a column. */
export function RecordBoardColumnHeader({
  asChild,
  className,
  children,
  ...rest
}: RecordBoardColumnHeaderProps) {
  const { surface } = useRecordBoard("RecordBoardColumnHeader");
  const column = useRecordBoardColumn("RecordBoardColumnHeader");
  return primitivePart(
    BoardColumnHeader,
    "h2",
    "fg-board-title",
    asChild,
    cx("fg-iboard-head", className),
    {
      "data-slot": "record-board-column-header",
      ...rest,
      children: children ?? (
        <>
          <RecordBoardColumnToggle />
          {surface.folded.has(column.key) ? null : <RecordBoardColumnActions />}
        </>
      ),
    },
  );
}

export interface RecordBoardColumnToggleProps extends ComponentProps<"button"> {
  asChild?: boolean;
}

/** The button that folds a column to a strip and opens it: its mark, its name, its count. */
export function RecordBoardColumnToggle({
  asChild,
  className,
  children,
  ...rest
}: RecordBoardColumnToggleProps) {
  const { surface, showCounts } = useRecordBoard("RecordBoardColumnToggle");
  const column = useRecordBoardColumn("RecordBoardColumnToggle");
  const open = !surface.folded.has(column.key);
  return renderPart("button", cx("fg-iboard-toggle", className), asChild, {
    type: "button",
    "data-slot": "record-board-column-toggle",
    "aria-expanded": open,
    title: `${open ? "Fold" : "Show"} ${column.name}`,
    onClick: () => surface.toggle(column.key),
    ...rest,
    children: children ?? (
      <>
        {column.glyph}
        <span className="fg-iboard-name">{column.name}</span>
        {showCounts ? <span className="fg-iboard-count">{column.records.length}</span> : null}
      </>
    ),
  });
}

export interface RecordBoardColumnActionsProps extends ComponentProps<"span"> {
  asChild?: boolean;
}

/** At the end of the header: the ⋯ and the + the board's `onColumnMenu` and `onAdd` ask for. */
export function RecordBoardColumnActions({
  asChild,
  className,
  children,
  ...rest
}: RecordBoardColumnActionsProps) {
  const { onAdd, onColumnMenu, noun } = useRecordBoard("RecordBoardColumnActions");
  const column = useRecordBoardColumn("RecordBoardColumnActions");
  return renderPart("span", cx("fg-iboard-acts", className), asChild, {
    "data-slot": "record-board-column-actions",
    ...rest,
    children: children ?? (
      <>
        {onColumnMenu ? (
          <IconButton
            icon={MoreHorizontalIcon}
            size="sm"
            label={`${column.name} options`}
            onClick={() => onColumnMenu(column.key)}
          />
        ) : null}
        {onAdd ? (
          <IconButton
            icon={PlusSignIcon}
            size="sm"
            label={`New ${noun} in ${column.name}`}
            onClick={() => onAdd(column.key)}
          />
        ) : null}
      </>
    ),
  });
}

export interface RecordBoardCardsProps extends Omit<ComponentProps<"ul">, "children"> {
  asChild?: boolean;
  /** A card per record of the column, and the "New …" button, by default. */
  children?: ReactNode;
}

/** The lane of a column: the list of its cards. Empty while the column is folded. */
export function RecordBoardCards({ asChild, className, children, ...rest }: RecordBoardCardsProps) {
  const { surface, onAdd } = useRecordBoard("RecordBoardCards");
  const column = useRecordBoardColumn("RecordBoardCards");
  const folded = surface.folded.has(column.key);
  return primitivePart(
    BoardCards,
    "ul",
    "fg-board-list",
    asChild,
    cx("fg-iboard-lane", className),
    {
      "data-slot": "record-board-cards",
      ...(folded ? {} : { "data-lane": column.key }),
      ...rest,
      children: folded
        ? null
        : (children ?? (
            <>
              {column.records.map((record) => (
                <RecordBoardCard key={record.id} record={record} />
              ))}
              {onAdd ? <RecordBoardAdd /> : null}
            </>
          )),
    },
  );
}

export interface RecordBoardCardProps<R extends RecordItem> extends Omit<
  ComponentProps<"li">,
  "children"
> {
  record: R;
  /** Extra content at the end of the card; `renderExtra` of the board by default. */
  extra?: ReactNode;
  /**
   * With `asChild`, the child element is the `<li>` itself and the menu area and the card are
   * yours. Else the card's content, `RecordCard` by default.
   */
  asChild?: boolean;
  children?: ReactNode;
}

/** A card in its lane: its row menu (right click) around the `RecordCard`. */
export function RecordBoardCard<R extends RecordItem>({
  record,
  extra,
  asChild,
  className,
  children,
  ...rest
}: RecordBoardCardProps<R>) {
  const { surface, renderCard, renderExtra } = useRecordBoard<R>("RecordBoardCard");
  return primitivePart(BoardCard, "li", "fg-board-card", asChild, cx("fg-iboard-item", className), {
    "data-slot": "record-board-card",
    ...rest,
    children: asChild ? (
      children
    ) : (
      <RowMenuArea {...surface.menu(record)}>
        {children ??
          (renderCard ? (
            renderCard(record, surface)
          ) : (
            <RecordCard record={record} extra={extra ?? renderExtra?.(record)} />
          ))}
      </RowMenuArea>
    ),
  });
}

/** The "New …" button at the end of a lane. */
export function RecordBoardAdd({
  className,
  children,
  onClick,
  ...rest
}: ComponentProps<"button">) {
  const { onAdd, noun } = useRecordBoard("RecordBoardAdd");
  const column = useRecordBoardColumn("RecordBoardAdd");
  return (
    <BoardCard className="fg-iboard-item" data-slot="record-board-add-item">
      <button
        type="button"
        data-slot="record-board-add"
        tabIndex={-1}
        {...rest}
        className={cx("fg-iboard-add", className)}
        onClick={(event) => {
          onClick?.(event);
          onAdd?.(column.key);
        }}
      >
        {children ?? (
          <>
            <Icon icon={PlusSignIcon} size={12} variant="mono" />
            New {noun}
          </>
        )}
      </button>
    </BoardCard>
  );
}

export interface RecordCardProps<R extends RecordItem> extends Omit<
  ComponentProps<"div">,
  "children"
> {
  record: R;
  /** The board's surface, when the card is drawn outside a `RecordBoard` (a `renderCard`). */
  surface?: Surface<R>;
  extra?: ReactNode;
  menuOpen?: { open: boolean; onOpenChange: (open: boolean) => void };
}

/** A card: the id and who on top, the title after its status, chips, the date. */
export function RecordCard<R extends RecordItem>({
  record,
  surface: given,
  extra,
  menuOpen: menuState,
  className,
  ...rest
}: RecordCardProps<R>) {
  const inherited = useContext(RecordSurfaceContext) as unknown as Surface<R> | null;
  const surface = given ?? inherited;
  if (!surface) throw new Error("<RecordCard> goes inside a <RecordBoard>, or takes a `surface`.");
  const menuOpen = menuState ?? surface.menuOpen(record.id);
  const { fields, context, menu } = surface;
  const shown = fields.keys.filter((k) => k !== surface.titleField && surface.shows(k));
  const at = (slot: string) => shown.filter((k) => (fields.def(k).place?.card ?? "chips") === slot);
  const mark = (name: string) => (
    <RecordFieldMark fields={fields} name={name} record={record} context={context} view="card" />
  );
  const slot = (name: string, node: ReactNode = mark(name)) => (
    <RecordFieldSlot
      key={name}
      surface={surface}
      record={record}
      name={name}
      className={slotClass(fields.def(name) as RecordFieldDef<never>)}
    >
      {node}
    </RecordFieldSlot>
  );
  // A field with nothing to draw has no mark to click: a hidden anchor still lets a shortcut open it.
  const present = (name: string) => !fields.isEmpty(record, name);
  const chips = at("chips");
  const foot = at("foot");
  const anchors = [...chips, ...foot].filter((k) => !present(k));
  const drawn = chips.filter(present);
  const content = (
    <>
      <span className="fg-iboard-top">
        <span className="fg-iboard-id">
          {at("top").map((k) =>
            fields.def(k).kind === "text" ? fields.text(record, k, context) : slot(k),
          )}
        </span>
        <span className="fg-iboard-who">{at("who").map((k) => slot(k))}</span>
      </span>
      <span className="fg-iboard-title">
        {at("lead").map((k) => slot(k))}
        <span>{fields.text(record, surface.titleField, context)}</span>
      </span>
      {drawn.length > 0 || extra ? (
        <span className="fg-iboard-chips">
          {drawn.map((k) => slot(k))}
          {extra}
        </span>
      ) : null}
      {foot.filter(present).map((k) => slot(k))}
      {anchors.map((k) => (
        <RecordFieldSlot key={k} surface={surface} record={record} name={k} unset>
          {null}
        </RecordFieldSlot>
      ))}
      <RowMore {...menu(record)} {...menuOpen} className="fg-iboard-more" />
    </>
  );
  const props = {
    "data-slot": "record-card",
    ...rest,
    className: cx(
      "fg-iboard-card",
      surface.collection.isSelected(record.id) && "fg-iboard-current",
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
