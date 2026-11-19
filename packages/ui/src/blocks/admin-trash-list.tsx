// The trash of an app: what was deleted, by whom and when, how many days it has left before it is
// gone for good, and the ways out: restore, delete forever (after a confirmation), or empty the
// whole trash. Rows can be selected to restore or delete several at once. The block deletes
// nothing: it asks, and the app does it.

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
  className?: string;
}

type Ask = { kind: "one" | "selection"; ids: string[] } | { kind: "empty" };

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
  className,
}: TrashListProps) {
  const [picked, setPicked] = useState<string[]>([]);
  const [ask, setAsk] = useState<Ask | null>(null);
  const rows = sortByRetention(items);
  const selected = picked.filter((id) => items.some((i) => i.id === id));
  const all = rows.length > 0 && selected.length === rows.length;
  const toggle = (id: string, on: boolean) =>
    setPicked(on ? [...selected, id] : selected.filter((x) => x !== id));
  const nameOf = (ids: string[]) =>
    ids.length === 1
      ? `“${items.find((i) => i.id === ids[0])?.name ?? noun}”`
      : adminPlural(ids.length, noun);

  return (
    <section className={cx("fg-adm fg-adm-trash", className)}>
      {notice ? (
        <Banner tone="info" title="Kept for a while">
          Deleted {noun}s stay here for {adminPlural(retentionDays, "day")}, then they are deleted
          forever.
        </Banner>
      ) : null}
      <div className="fg-adm-bar">
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
          {onEmpty ? (
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
      </div>
      {rows.length === 0 ? (
        <p className="fg-adm-empty">{empty}</p>
      ) : (
        <ul className="fg-adm-trash-list" aria-label="Deleted items">
          <li className="fg-adm-trash-head">
            <Checkbox
              label={<span className="fg-sr">Select every {noun}</span>}
              checked={all}
              onChange={(e) => setPicked(e.currentTarget.checked ? rows.map((r) => r.id) : [])}
            />
          </li>
          {rows.map((r) => {
            const left = retentionDaysLeft(r.deletedAt, today, retentionDays);
            return (
              <li key={r.id} className="fg-adm-trash-row">
                <Checkbox
                  label={<span className="fg-sr">Select {r.name}</span>}
                  checked={selected.includes(r.id)}
                  onChange={(e) => toggle(r.id, e.currentTarget.checked)}
                />
                <span className="fg-adm-trash-main">
                  <span className="fg-adm-trash-name">{r.name}</span>
                  <span className="fg-adm-trash-meta">
                    {r.kind ? `${r.kind} · ` : ""}deleted by {r.deletedBy},{" "}
                    {relativeDay(r.deletedAt, today)}
                  </span>
                </span>
                <Badge tone={retentionUrgent(left) ? "warning" : "neutral"}>
                  {retentionText(left)}
                </Badge>
                <span className="fg-adm-trash-actions">
                  <Button
                    size="sm"
                    aria-label={`Restore ${r.name}`}
                    onClick={() => onRestore([r.id])}
                  >
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
          })}
        </ul>
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
  );
}
