// Records as cards in columns, whatever the records are: the columns are the values of a groupable
// field (`recordGroups`), the cards draw the fields shown. Layout only: moving a card is the
// caller's, through its own menus or shortcuts (`onRecordChange` with a patch from `fields.patch`).

import { MoreHorizontalIcon, PlusSignIcon } from "@forgeron/icons";
import type { KeyboardEvent, ReactNode } from "react";
import { cx } from "../cx";
import { Icon } from "../icon";
import { IconButton } from "../identity";
import { isMenuKey, RowMenuArea, RowMore } from "./lists-editing";
import { RecordFieldMark, type RecordGroup } from "./records-fields";
import type { RecordFieldDef } from "./records-model";
import {
  RecordFieldSlot,
  useRecordSurface,
  type RecordItem,
  type RecordSurfaceProps,
  type Surface,
} from "./records-surface";

export interface RecordBoardProps<R extends RecordItem> extends RecordSurfaceProps<R> {
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
  showCounts = false,
  label = "Board",
  className,
  ...props
}: RecordBoardProps<R>) {
  const surface = useRecordSurface(props, columns);
  const { collection, folded, menu, menuOpen, openMenu, attr } = surface;

  // Up and down inside a lane, left and right to the same rank of the next open lane.
  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    const card = (event.target as HTMLElement).closest<HTMLElement>(`[${attr}]`);
    if (!card) return;
    const id = card.getAttribute(attr)!;
    if (isMenuKey(event)) {
      event.preventDefault();
      collection.select(id);
      openMenu(id);
      return;
    }
    const lanes = [...event.currentTarget.querySelectorAll<HTMLElement>("[data-lane]")]
      .map((lane) => [...lane.querySelectorAll<HTMLElement>(`[${attr}]`)])
      .filter((cards) => cards.length > 0);
    const col = lanes.findIndex((cards) => cards.includes(card));
    const lane = lanes[col];
    if (!lane) return;
    const rank = lane.indexOf(card);
    let next: HTMLElement | undefined;
    if (event.key === "ArrowDown") next = lane[rank + 1];
    else if (event.key === "ArrowUp") next = lane[rank - 1];
    else if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      const other = lanes[col + (event.key === "ArrowRight" ? 1 : -1)];
      next = other?.[Math.min(rank, other.length - 1)];
    } else return;
    event.preventDefault();
    const to = next?.getAttribute(attr);
    if (!to) return;
    collection.focus(to);
    collection.select(to);
  };

  return (
    <div
      {...surface.rootProps({
        className: cx("fg-iboard", className),
        role: "region",
        "aria-label": label,
        onKeyDown,
      })}
    >
      {columns.map((column) => {
        const count = showCounts ? (
          <span className="fg-iboard-count">{column.records.length}</span>
        ) : null;
        if (folded.has(column.key)) {
          return (
            <section
              key={column.key}
              className="fg-iboard-col fg-iboard-folded"
              aria-label={column.name}
            >
              <button
                type="button"
                className="fg-iboard-head"
                aria-expanded={false}
                title={`Show ${column.name}`}
                onClick={() => surface.toggle(column.key)}
              >
                {column.glyph}
                <span className="fg-iboard-name">{column.name}</span>
                {count}
              </button>
              <div className="fg-iboard-lane" />
            </section>
          );
        }
        return (
          <section key={column.key} className="fg-iboard-col" aria-label={column.name}>
            <div className="fg-iboard-head">
              <button
                type="button"
                className="fg-iboard-toggle"
                aria-expanded={true}
                title={`Fold ${column.name}`}
                onClick={() => surface.toggle(column.key)}
              >
                {column.glyph}
                <span className="fg-iboard-name">{column.name}</span>
                {count}
              </button>
              <span className="fg-iboard-acts">
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
              </span>
            </div>
            <ul className="fg-iboard-lane" data-lane={column.key}>
              {column.records.map((record) => (
                <li key={record.id}>
                  <RowMenuArea {...menu(record)}>
                    {renderCard ? (
                      renderCard(record, surface)
                    ) : (
                      <RecordCard
                        record={record}
                        surface={surface}
                        extra={renderExtra?.(record)}
                        menuOpen={menuOpen(record.id)}
                      />
                    )}
                  </RowMenuArea>
                </li>
              ))}
              {onAdd ? (
                <li>
                  <button
                    type="button"
                    className="fg-iboard-add"
                    onClick={() => onAdd(column.key)}
                    tabIndex={-1}
                  >
                    <Icon icon={PlusSignIcon} size={12} variant="mono" />
                    New {noun}
                  </button>
                </li>
              ) : null}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

/** A card: the id and who on top, the title after its status, chips, the date. */
export function RecordCard<R extends RecordItem>({
  record,
  surface,
  extra,
  menuOpen,
}: {
  record: R;
  surface: Surface<R>;
  extra?: ReactNode;
  menuOpen: { open: boolean; onOpenChange: (open: boolean) => void };
}) {
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
    className: cx(
      "fg-iboard-card",
      surface.collection.isSelected(record.id) && "fg-iboard-current",
    ),
    ...surface.itemProps(record),
  };
  if (!surface.interactive) {
    return (
      <button type="button" {...props}>
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
