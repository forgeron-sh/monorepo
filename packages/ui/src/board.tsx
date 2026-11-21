import type { ComponentProps, Key, ReactNode } from "react";
import { cx } from "./cx";

export interface BoardColumn<Item> {
  id: Key;
  title: ReactNode;
  items: ReadonlyArray<Item>;
}

export interface BoardProps<Item> {
  columns: ReadonlyArray<BoardColumn<Item>>;
  itemKey: (item: Item) => Key;
  renderItem: (item: Item) => ReactNode;
  /** Shown in a column without items. */
  empty?: ReactNode;
  className?: string;
}

/** The parts form: BoardColumn elements as children. */
export interface BoardRootProps extends Omit<ComponentProps<"div">, "children"> {
  columns?: undefined;
  children?: ReactNode;
}

/**
 * Columns of cards (status board). Layout only: moving cards is up to the caller. With `columns`
 * it builds itself; without, compose BoardColumn, BoardColumnHeader, BoardCards and BoardCard.
 */
export function Board<Item>(props: BoardProps<Item> | BoardRootProps) {
  if (props.columns === undefined) {
    const { columns: _columns, className, children, ...rest } = props;
    return (
      <div data-slot="board" {...rest} className={cx("fg-board", className)}>
        {children}
      </div>
    );
  }
  const { columns, itemKey, renderItem, empty = "Empty", className } = props;
  return (
    <Board className={className}>
      {columns.map((col) => (
        <BoardColumn key={col.id}>
          <BoardColumnHeader count={col.items.length}>{col.title}</BoardColumnHeader>
          {col.items.length === 0 ? (
            <BoardEmpty>{empty}</BoardEmpty>
          ) : (
            <BoardCards>
              {col.items.map((item) => (
                <BoardCard key={itemKey(item)}>{renderItem(item)}</BoardCard>
              ))}
            </BoardCards>
          )}
        </BoardColumn>
      ))}
    </Board>
  );
}

/** One column: a header and its cards. */
export function BoardColumn({ className, ...rest }: ComponentProps<"section">) {
  return <section data-slot="board-column" className={cx("fg-board-col", className)} {...rest} />;
}

export interface BoardColumnHeaderProps extends ComponentProps<"h2"> {
  /** The number of cards, shown at the end of the header. */
  count?: number;
}

export function BoardColumnHeader({ count, className, children, ...rest }: BoardColumnHeaderProps) {
  return (
    <h2 data-slot="board-column-header" className={cx("fg-board-title", className)} {...rest}>
      {children}
      {count === undefined ? null : <span className="fg-board-count">{count}</span>}
    </h2>
  );
}

/** The list of a column's cards. */
export function BoardCards({ className, ...rest }: ComponentProps<"ul">) {
  return <ul data-slot="board-cards" className={cx("fg-board-list", className)} {...rest} />;
}

export function BoardCard({ className, ...rest }: ComponentProps<"li">) {
  return <li data-slot="board-card" className={cx("fg-board-card", className)} {...rest} />;
}

/** What a column without cards says. */
export function BoardEmpty({ className, ...rest }: ComponentProps<"p">) {
  return <p data-slot="board-empty" className={cx("fg-board-empty", className)} {...rest} />;
}
