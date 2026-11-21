// The trash of an app: what was deleted, by whom and when, how many days it has left before it is
// gone for good, and the ways out: restore, delete forever (after a confirmation), or empty the
// whole trash. Rows can be selected to restore or delete several at once. The block deletes
// nothing: it asks, and the app does it.
//
// A root with parts. Without children it draws the usual list; with children they place its
// regions: `TrashListNotice`, `TrashListBar`, `TrashListRows` (or `TrashListEmpty`), and the
// confirmation that the root opens by itself.

import type { ComponentProps, ReactNode } from "react";
import { createContext, useContext } from "react";
import { Badge } from "../badge";
import { Banner } from "../banner";
import { Button } from "../button";
import { cx } from "../cx";
import { Checkbox } from "../form";
import { useState } from "react";
import {
  adminPlural,
  relativeDay,
  retentionDaysLeft,
  retentionText,
  retentionUrgent,
  sortByRetention,
  type TrashEntry,
} from "./admin-model";
import { AdminConfirm } from "./admin-parts";

export interface TrashListProps {
  items: ReadonlyArray<TrashEntry>;
  /** Today, `YYYY-MM-DD`: deletion dates and the days left are told from it. */
  today: string;
  /** Days an item stays before it is deleted for good. Default 30. */
  retentionDays?: number;
  /** Put these back. Called with one id from a row, with several from the selection. */
  onRestore: (ids: string[]) => void;
  /** Delete these forever, once the person has confirmed. */
  onDeleteForever: (ids: string[]) => void;
  /** Delete everything in the trash, once confirmed. Without it there is no Empty trash button. */
  onEmpty?: () => void;
  /** The retention notice. `false` hides it. */
  notice?: boolean;
  /** The word for one item: "item", "project". Default "item". */
  noun?: string;
  empty?: string;
  /** The regions of the block; without them, the notice, the bar and the rows. */
  children?: ReactNode;
  className?: string;
}

type Ask = { kind: "one" | "selection"; ids: string[] } | { kind: "empty" };

interface TrashContext {
  rows: ReadonlyArray<TrashEntry>;
  today: string;
  retentionDays: number;
  noun: string;
  empty: string;
  selected: string[];
  setPicked: (ids: string[]) => void;
  toggle: (id: string, on: boolean) => void;
  setAsk: (ask: Ask | null) => void;
  onRestore: (ids: string[]) => void;
  canEmpty: boolean;
}

const Ctx = createContext<TrashContext | null>(null);

/** The rows, the selection and the actions of the enclosing `TrashList`. */
export function useTrashList(part = "useTrashList"): TrashContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error(`<${part}> goes inside a <TrashList>.`);
  return ctx;
}

/** Deleted items with who and when, days left, restore, delete forever and empty trash. */
export function TrashList({
  items,
  today,
  retentionDays = 30,
  onRestore,
  onDeleteForever,
  onEmpty,
  notice = true,
  noun = "item",
  empty = "The trash is empty.",
  children,
  className,
}: TrashListProps) {
  const [picked, setPicked] = useState<string[]>([]);
  const [ask, setAsk] = useState<Ask | null>(null);
  const rows = sortByRetention(items);
  const selected = picked.filter((id) => items.some((i) => i.id === id));
  const toggle = (id: string, on: boolean) =>
    setPicked(on ? [...selected, id] : selected.filter((x) => x !== id));
  const nameOf = (ids: string[]) =>
    ids.length === 1
      ? `“${items.find((i) => i.id === ids[0])?.name ?? noun}”`
      : adminPlural(ids.length, noun);

  return (
    <Ctx.Provider
      value={{
        rows,
        today,
        retentionDays,
        noun,
        empty,
        selected,
        setPicked,
        toggle,
        setAsk,
        onRestore,
        canEmpty: Boolean(onEmpty),
      }}
    >
      <section data-slot="trash-list" className={cx("fg-adm fg-adm-trash", className)}>
        {children ?? (
          <>
            {notice ? <TrashListNotice /> : null}
            <TrashListBar />
            {rows.length === 0 ? <TrashListEmpty /> : <TrashListRows />}
          </>
        )}
        {ask ? (
          <AdminConfirm
            title={ask.kind === "empty" ? "Empty the trash?" : `Delete ${nameOf(ask.ids)} forever?`}
            description={
              ask.kind === "empty"
                ? `${adminPlural(rows.length, noun)} will be deleted forever. This cannot be undone.`
                : "It cannot be restored afterwards."
            }
            confirmLabel={ask.kind === "empty" ? "Empty trash" : "Delete forever"}
            onCancel={() => setAsk(null)}
            onConfirm={() => {
              if (ask.kind === "empty") onEmpty?.();
              else onDeleteForever(ask.ids);
              setPicked([]);
              setAsk(null);
            }}
          />
        ) : null}
      </section>
    </Ctx.Provider>
  );
}

/** How long deleted items stay. */
export function TrashListNotice({ children, ...rest }: ComponentProps<typeof Banner>) {
  const { noun, retentionDays } = useTrashList("TrashListNotice");
  return (
    <Banner data-slot="trash-list-notice" tone="info" title="Kept for a while" {...rest}>
      {children ?? (
        <>
          Deleted {noun}s stay here for {adminPlural(retentionDays, "day")}, then they are deleted
          forever.
        </>
      )}
    </Banner>
  );
}

/** The count and the actions on the selection and on the whole trash. */
export function TrashListBar({ className, children, ...rest }: ComponentProps<"div">) {
  const { rows, selected, setPicked, setAsk, onRestore, canEmpty, noun } =
    useTrashList("TrashListBar");
  return (
    <div data-slot="trash-list-bar" {...rest} className={cx("fg-adm-bar", className)}>
      {children ?? (
        <>
          <span className="fg-adm-count">
            {selected.length ? `${selected.length} selected` : adminPlural(rows.length, noun)}
          </span>
          <span className="fg-adm-bar-actions">
            {selected.length ? (
              <>
                <Button
                  size="sm"
                  onClick={() => {
                    onRestore(selected);
                    setPicked([]);
                  }}
                >
                  Restore selected
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => setAsk({ kind: "selection", ids: selected })}
                >
                  Delete selected
                </Button>
              </>
            ) : null}
            {canEmpty ? (
              <Button
                size="sm"
                variant="danger"
                disabled={rows.length === 0}
                onClick={() => setAsk({ kind: "empty" })}
              >
                Empty trash
              </Button>
            ) : null}
          </span>
        </>
      )}
    </div>
  );
}

/** Says so when the trash is empty. */
export function TrashListEmpty({ className, children, ...rest }: ComponentProps<"p">) {
  const { empty } = useTrashList("TrashListEmpty");
  return (
    <p data-slot="trash-list-empty" {...rest} className={cx("fg-adm-empty", className)}>
      {children ?? empty}
    </p>
  );
}

/** The list: a header with the select-all box, then a `TrashListRow` for each entry. */
export function TrashListRows({ className, children, ...rest }: ComponentProps<"ul">) {
  const { rows, selected, setPicked, noun } = useTrashList("TrashListRows");
  const all = rows.length > 0 && selected.length === rows.length;
  return (
    <ul
      data-slot="trash-list-rows"
      aria-label="Deleted items"
      {...rest}
      className={cx("fg-adm-trash-list", className)}
    >
      <li className="fg-adm-trash-head">
        <Checkbox
          label={<span className="fg-sr">Select every {noun}</span>}
          checked={all}
          onChange={(e) => setPicked(e.currentTarget.checked ? rows.map((r) => r.id) : [])}
        />
      </li>
      {children ?? rows.map((r) => <TrashListRow key={r.id} entry={r} />)}
    </ul>
  );
}

/** One deleted item: its box, name, days left and the two ways out. */
export function TrashListRow({
  entry: r,
  className,
  ...rest
}: ComponentProps<"li"> & { entry: TrashEntry }) {
  const { today, retentionDays, selected, toggle, setAsk, onRestore } =
    useTrashList("TrashListRow");
  const left = retentionDaysLeft(r.deletedAt, today, retentionDays);
  return (
    <li data-slot="trash-list-row" {...rest} className={cx("fg-adm-trash-row", className)}>
      <Checkbox
        label={<span className="fg-sr">Select {r.name}</span>}
        checked={selected.includes(r.id)}
        onChange={(e) => toggle(r.id, e.currentTarget.checked)}
      />
      <span className="fg-adm-trash-main">
        <span className="fg-adm-trash-name">{r.name}</span>
        <span className="fg-adm-trash-meta">
          {r.kind ? `${r.kind} · ` : ""}deleted by {r.deletedBy}, {relativeDay(r.deletedAt, today)}
        </span>
      </span>
      <Badge tone={retentionUrgent(left) ? "warning" : "neutral"}>{retentionText(left)}</Badge>
      <span className="fg-adm-trash-actions">
        <Button size="sm" aria-label={`Restore ${r.name}`} onClick={() => onRestore([r.id])}>
          Restore
        </Button>
        <Button
          size="sm"
          variant="ghost"
          aria-label={`Delete ${r.name} forever`}
          onClick={() => setAsk({ kind: "one", ids: [r.id] })}
        >
          Delete forever
        </Button>
      </span>
    </li>
  );
}
