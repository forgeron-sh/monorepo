// What changed between two versions: a text diff by lines, unified or side by side, with the
// changed words marked and long unchanged runs folded; the same for the fields of a record
// (before → after); and VersionCompare, which picks two versions of a list and shows the diff.
// The algorithm is in diff-model.ts (Myers, no dependency).

import { ArrowRight01Icon, RollbackIcon } from "@forgeron/icons";
import { Fragment, useState, type ReactNode } from "react";
import { Avatar } from "./avatar";
import { Button } from "./button";
import { Segmented } from "./controls";
import { cx } from "./cx";
import { useControllableState } from "./hooks/use-controllable";
import { Icon } from "./icon";
import {
  structureDiffFields,
  structureDiffRows,
  structureDiffStats,
  structureSplitRows,
  type StructureDiffPiece,
  type StructureDiffRow,
  type StructureFieldChange,
} from "./diff-model";

export type DiffMode = "unified" | "split";

export interface DiffViewProps {
  /** The older text. */
  before: string;
  /** The newer text. */
  after: string;
  mode?: DiffMode;
  defaultMode?: DiffMode;
  onModeChange?: (mode: DiffMode) => void;
  /** Unchanged lines kept around a change. Default 3. */
  context?: number;
  /** Fold the long runs of unchanged lines. Default `true`. */
  collapse?: boolean;
  /** Names the two sides: "v2", "v4". Defaults "Before" and "After". */
  beforeLabel?: string;
  afterLabel?: string;
  /** Hides the mode switch and the counts. */
  bare?: boolean;
  /** Shown when the texts are the same. */
  same?: ReactNode;
  className?: string;
}

const pieces = (
  text: string,
  parts: ReadonlyArray<StructureDiffPiece> | undefined,
  tag: "ins" | "del",
) =>
  parts
    ? parts.map((p, i) =>
        p.changed ? (
          tag === "ins" ? (
            <ins key={i} className="fg-diff-word">
              {p.text}
            </ins>
          ) : (
            <del key={i} className="fg-diff-word">
              {p.text}
            </del>
          )
        ) : (
          <Fragment key={i}>{p.text}</Fragment>
        ),
      )
    : text || " ";

/** Two texts compared line by line, unified or in two columns, the changed words marked. */
export function DiffView({
  before,
  after,
  mode,
  defaultMode = "unified",
  onModeChange,
  context = 3,
  collapse = true,
  beforeLabel = "Before",
  afterLabel = "After",
  bare = false,
  same,
  className,
}: DiffViewProps) {
  const [view, setView] = useControllableState<DiffMode>({
    value: mode,
    defaultValue: defaultMode,
    onChange: onModeChange,
  });
  const [opened, setOpened] = useState<ReadonlySet<string>>(new Set());
  const rows = structureDiffRows(before, after, { context, collapse, expanded: opened });
  const stats = structureDiffStats(rows);
  const unchanged = stats.added + stats.removed === 0;
  const unfold = (id: string) => setOpened((s) => new Set(s).add(id));

  const fold = (row: Extract<StructureDiffRow, { kind: "fold" }>, span: number) => (
    <tr key={row.id} className="fg-diff-foldrow">
      <td colSpan={span}>
        <button type="button" className="fg-diff-fold" onClick={() => unfold(row.id)}>
          <Icon icon={ArrowRight01Icon} size={12} variant="mono" />
          {row.count} unchanged lines
        </button>
      </td>
    </tr>
  );

  return (
    <div className={cx("fg-diff", className)}>
      {bare ? null : (
        <div className="fg-diff-bar">
          <span className="fg-diff-stats">
            <b className="fg-diff-plus">+{stats.added}</b>
            <b className="fg-diff-minus">−{stats.removed}</b>
          </span>
          <Segmented
            label="Layout"
            value={view}
            onChange={(v) => setView(v as DiffMode)}
            options={[
              { value: "unified", label: "Unified" },
              { value: "split", label: "Split" },
            ]}
          />
        </div>
      )}
      {unchanged ? (
        <p className="fg-diff-same" role="status">
          {same ?? "No difference."}
        </p>
      ) : view === "unified" ? (
        <table className="fg-diff-table fg-diff-unified">
          <caption className="fg-visually-hidden">
            Changes from {beforeLabel} to {afterLabel}
          </caption>
          <colgroup>
            <col className="fg-diff-col-no" />
            <col className="fg-diff-col-no" />
            <col className="fg-diff-col-sign" />
            <col />
          </colgroup>
          <tbody>
            {rows.map((row, i) => {
              if (row.kind === "fold") return fold(row, 4);
              const sign = row.kind === "add" ? "+" : row.kind === "del" ? "−" : " ";
              return (
                <tr key={i} className={cx("fg-diff-row", `fg-diff-${row.kind}`)}>
                  <td className="fg-diff-no">{"aNo" in row ? row.aNo : ""}</td>
                  <td className="fg-diff-no">{"bNo" in row ? row.bNo : ""}</td>
                  <td
                    className="fg-diff-sign"
                    aria-label={
                      row.kind === "add" ? "Added" : row.kind === "del" ? "Removed" : undefined
                    }
                  >
                    {sign}
                  </td>
                  <td className="fg-diff-text">
                    {row.kind === "same"
                      ? row.text || " "
                      : pieces(row.text, row.pieces, row.kind === "add" ? "ins" : "del")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <table className="fg-diff-table fg-diff-split">
          <caption className="fg-visually-hidden">
            Changes from {beforeLabel} to {afterLabel}
          </caption>
          <colgroup>
            <col className="fg-diff-col-no" />
            <col className="fg-diff-col-sign" />
            <col />
            <col className="fg-diff-col-no" />
            <col className="fg-diff-col-sign" />
            <col />
          </colgroup>
          <thead>
            <tr>
              <th colSpan={3} scope="colgroup" className="fg-diff-side">
                {beforeLabel}
              </th>
              <th colSpan={3} scope="colgroup" className="fg-diff-side">
                {afterLabel}
              </th>
            </tr>
          </thead>
          <tbody>
            {structureSplitRows(rows).map((row, i) =>
              row.fold ? (
                fold(row.fold, 6)
              ) : (
                <tr key={i} className="fg-diff-row">
                  <td className={cx("fg-diff-no", row.left?.kind === "del" && "fg-diff-del")}>
                    {row.left?.no ?? ""}
                  </td>
                  <td
                    className={cx("fg-diff-sign", row.left?.kind === "del" && "fg-diff-del")}
                    aria-label={row.left?.kind === "del" ? "Removed" : undefined}
                  >
                    {row.left?.kind === "del" ? "−" : ""}
                  </td>
                  <td
                    className={cx(
                      "fg-diff-text",
                      row.left?.kind === "del" && "fg-diff-del",
                      !row.left && "fg-diff-blank",
                    )}
                  >
                    {row.left ? pieces(row.left.text, row.left.pieces, "del") : ""}
                  </td>
                  <td
                    className={cx(
                      "fg-diff-no fg-diff-gap",
                      row.right?.kind === "add" && "fg-diff-add",
                    )}
                  >
                    {row.right?.no ?? ""}
                  </td>
                  <td
                    className={cx("fg-diff-sign", row.right?.kind === "add" && "fg-diff-add")}
                    aria-label={row.right?.kind === "add" ? "Added" : undefined}
                  >
                    {row.right?.kind === "add" ? "+" : ""}
                  </td>
                  <td
                    className={cx(
                      "fg-diff-text",
                      row.right?.kind === "add" && "fg-diff-add",
                      !row.right && "fg-diff-blank",
                    )}
                  >
                    {row.right ? pieces(row.right.text, row.right.pieces, "ins") : ""}
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

export interface FieldDiffProps {
  /** The older record. */
  before: Record<string, unknown>;
  /** The newer record. */
  after: Record<string, unknown>;
  /** The name shown for a field: `{ "address.city": "City" }`. The key by default. */
  labels?: Readonly<Record<string, string>>;
  /** Also lists the fields that did not change. Default `false`, with a button to show them. */
  showUnchanged?: boolean;
  beforeLabel?: string;
  afterLabel?: string;
  /** Shown when nothing changed. */
  same?: ReactNode;
  className?: string;
}

const STATUS_WORD: Record<StructureFieldChange["status"], string> = {
  added: "Added",
  removed: "Removed",
  changed: "Changed",
  same: "Unchanged",
};

/** The fields of two records: what each one was, and what it became. */
export function FieldDiff({
  before,
  after,
  labels = {},
  showUnchanged = false,
  beforeLabel = "Before",
  afterLabel = "After",
  same,
  className,
}: FieldDiffProps) {
  const [all, setAll] = useState(showUnchanged);
  const changes = structureDiffFields(before, after);
  const changed = changes.filter((c) => c.status !== "same");
  const rows = all ? changes : changed;
  const hidden = changes.length - changed.length;
  return (
    <div className={cx("fg-fdiff", className)}>
      {changed.length === 0 ? (
        <p className="fg-diff-same" role="status">
          {same ?? "No field changed."}
        </p>
      ) : null}
      {rows.length > 0 ? (
        <table className="fg-fdiff-table">
          <caption className="fg-visually-hidden">
            Fields from {beforeLabel} to {afterLabel}
          </caption>
          <thead>
            <tr>
              <th scope="col">Field</th>
              <th scope="col">{beforeLabel}</th>
              <th scope="col" aria-hidden="true" />
              <th scope="col">{afterLabel}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.key} className={cx("fg-fdiff-row", `fg-fdiff-${c.status}`)}>
                <th scope="row" className="fg-fdiff-key">
                  {labels[c.key] ?? c.key}
                  <span className="fg-visually-hidden"> ({STATUS_WORD[c.status]})</span>
                </th>
                <td className="fg-fdiff-before">
                  {c.status === "added" ? (
                    <span className="fg-fdiff-empty">—</span>
                  ) : (
                    <span className={cx(c.status !== "same" && "fg-fdiff-old")}>
                      {c.before === "" ? (
                        <span className="fg-fdiff-empty">empty</span>
                      ) : (
                        pieces(c.before ?? "", c.pieces?.before, "del")
                      )}
                    </span>
                  )}
                </td>
                <td className="fg-fdiff-arrow" aria-hidden="true">
                  <Icon icon={ArrowRight01Icon} size={12} variant="mono" />
                </td>
                <td className="fg-fdiff-after">
                  {c.status === "removed" ? (
                    <span className="fg-fdiff-empty">—</span>
                  ) : (
                    <span className={cx(c.status !== "same" && "fg-fdiff-new")}>
                      {c.after === "" ? (
                        <span className="fg-fdiff-empty">empty</span>
                      ) : (
                        pieces(c.after ?? "", c.pieces?.after, "ins")
                      )}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
      {hidden > 0 ? (
        <Button size="sm" variant="ghost" onClick={() => setAll((v) => !v)} aria-pressed={all}>
          {all ? "Hide unchanged" : `Show ${hidden} unchanged`}
        </Button>
      ) : null}
    </div>
  );
}

export interface CompareVersion {
  id: string;
  /** "v4". */
  label: string;
  /** When it was written, already formatted. */
  at: string;
  by: string;
  /** Why: "Prices updated". */
  note?: string;
  /** The text, or the fields of a record. */
  content: string | Record<string, unknown>;
}

export interface VersionCompareProps {
  /** Newest first; the first one is the current version. */
  versions: ReadonlyArray<CompareVersion>;
  /** The older side. Default: the version before the one on the right. */
  from?: string;
  defaultFrom?: string;
  onFromChange?: (id: string) => void;
  /** The newer side. Default: the current version. */
  to?: string;
  defaultTo?: string;
  onToChange?: (id: string) => void;
  /** Makes an older version the current one; leave out on a read-only record. */
  onRestore?: (id: string) => void;
  /** The names of the fields, for records. */
  labels?: Readonly<Record<string, string>>;
  mode?: DiffMode;
  defaultMode?: DiffMode;
  onModeChange?: (mode: DiffMode) => void;
  className?: string;
}

/** The versions of a document or record in a list; pick two and see what changed between them. */
export function VersionCompare({
  versions,
  from,
  defaultFrom,
  onFromChange,
  to,
  defaultTo,
  onToChange,
  onRestore,
  labels,
  mode,
  defaultMode,
  onModeChange,
  className,
}: VersionCompareProps) {
  const [right, setRight] = useControllableState<string>({
    value: to,
    defaultValue: defaultTo ?? versions[0]?.id ?? "",
    onChange: onToChange,
  });
  const [left, setLeft] = useControllableState<string>({
    value: from,
    defaultValue: defaultFrom ?? versions[1]?.id ?? versions[0]?.id ?? "",
    onChange: onFromChange,
  });
  const a = versions.find((v) => v.id === left);
  const b = versions.find((v) => v.id === right);

  const body = () => {
    if (!a || !b) return <p className="fg-diff-same">Pick two versions.</p>;
    if (a.id === b.id)
      return (
        <p className="fg-diff-same" role="status">
          Pick two different versions.
        </p>
      );
    if (typeof a.content === "string" && typeof b.content === "string")
      return (
        <DiffView
          before={a.content}
          after={b.content}
          beforeLabel={a.label}
          afterLabel={b.label}
          {...(mode ? { mode } : {})}
          {...(defaultMode ? { defaultMode } : {})}
          {...(onModeChange ? { onModeChange } : {})}
        />
      );
    const rec = (v: CompareVersion) =>
      typeof v.content === "string" ? { text: v.content } : v.content;
    return (
      <FieldDiff
        before={rec(a)}
        after={rec(b)}
        beforeLabel={a.label}
        afterLabel={b.label}
        {...(labels ? { labels } : {})}
      />
    );
  };

  return (
    <div className={cx("fg-vcmp", className)}>
      <ol className="fg-vcmp-list" aria-label="Versions">
        {versions.map((v, i) => (
          <li
            key={v.id}
            className={cx("fg-vcmp-row", (v.id === left || v.id === right) && "fg-vcmp-picked")}
          >
            <span className="fg-vcmp-label">{v.label}</span>
            <div className="fg-vcmp-text">
              <b>{i === 0 ? "Current version" : v.at}</b>
              <span className="fg-vcmp-by">
                <Avatar name={v.by} size={16} />
                {v.by}
                {i === 0 ? ` · ${v.at}` : ""}
              </span>
              {v.note ? <i className="fg-vcmp-note">{v.note}</i> : null}
            </div>
            <span className="fg-vcmp-acts">
              <button
                type="button"
                className="fg-vcmp-side"
                aria-pressed={v.id === left}
                aria-label={`Compare from ${v.label}`}
                onClick={() => setLeft(v.id)}
              >
                From
              </button>
              <button
                type="button"
                className="fg-vcmp-side"
                aria-pressed={v.id === right}
                aria-label={`Compare to ${v.label}`}
                onClick={() => setRight(v.id)}
              >
                To
              </button>
              {onRestore && i > 0 ? (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onRestore(v.id)}
                  aria-label={`Restore ${v.label}`}
                >
                  <Icon icon={RollbackIcon} size={12} variant="mono" />
                </Button>
              ) : null}
            </span>
          </li>
        ))}
      </ol>
      <div className="fg-vcmp-view">
        {a && b ? (
          <h3 className="fg-vcmp-title">
            {a.label}
            <Icon icon={ArrowRight01Icon} size={12} variant="mono" />
            {b.label}
          </h3>
        ) : null}
        {body()}
      </div>
    </div>
  );
}
