import type { Key, ReactNode } from "react";
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

/** Columns of cards (status board). Layout only: moving cards is up to the caller. */
export function Board<Item>({
  columns,
  itemKey,
  renderItem,
  empty = "Empty",
  className,
}: BoardProps<Item>) {
  return (
    <div className={cx("fg-board", className)}>
      {columns.map((col) => (
        <section key={col.id} className="fg-board-col">
          <h2 className="fg-board-title">
            {col.title}
            <span className="fg-board-count">{col.items.length}</span>
          </h2>
          {col.items.length === 0 ? (
            <p className="fg-board-empty">{empty}</p>
          ) : (
            <ul className="fg-board-list">
              {col.items.map((item) => (
                <li key={itemKey(item)} className="fg-board-card">
                  {renderItem(item)}
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
