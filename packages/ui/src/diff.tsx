// What changed between two versions: a text diff by lines, unified or side by side, with the
// changed words marked and long unchanged runs folded; the same for the fields of a record
// (before → after); and VersionCompare, which picks two versions of a list and shows the diff.
// The algorithm is in diff-model.ts (Myers, no dependency).

import { ArrowRight01Icon, RollbackIcon } from "@forgeron/icons";
import {
  createContext,
  Fragment,
  useContext,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
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

/** The parts form of DiffView: a bar, a table of hunks, as children. */
export interface DiffViewRootProps extends Omit<ComponentProps<"div">, "children"> {
  before?: undefined;
  after?: undefined;
  mode?: DiffMode;
  defaultMode?: DiffMode;
  onModeChange?: (mode: DiffMode) => void;
  beforeLabel?: string;
  afterLabel?: string;
  children?: ReactNode;
}

interface DiffContext {
  mode: DiffMode;
  setMode: (mode: DiffMode) => void;
  beforeLabel: string;
  afterLabel: string;
}

const DiffCtx = createContext<DiffContext>({
  mode: "unified",
  setMode: () => {},
  beforeLabel: "Before",
  afterLabel: "After",
});

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

/**
 * Two texts compared line by line, unified or in two columns, the changed words marked. With
 * `before` and `after` it builds itself; without, compose DiffBar, DiffTable, DiffHunk, DiffLine,
 * DiffSplitLine and DiffFold from `structureDiffRows`.
 */
export function DiffView(props: DiffViewProps | DiffViewRootProps) {
  return props.before === undefined ? (
    <DiffRoot {...(props as DiffViewRootProps)} />
  ) : (
    <DiffText {...(props as DiffViewProps)} />
  );
}

function DiffRoot({
  before: _before,
  after: _after,
  mode,
  defaultMode = "unified",
  onModeChange,
  beforeLabel = "Before",
  afterLabel = "After",
  className,
  children,
  ...rest
}: DiffViewRootProps) {
  const [view, setView] = useControllableState<DiffMode>({
    value: mode,
    defaultValue: defaultMode,
    onChange: onModeChange,
  });
  return (
    <DiffCtx.Provider value={{ mode: view, setMode: setView, beforeLabel, afterLabel }}>
      <div data-slot="diff-view" {...rest} className={cx("fg-diff", className)}>
        {children}
      </div>
    </DiffCtx.Provider>
  );
}

/** The counts of added and removed lines, and the mode switch (`bare` of the props form hides it). */
export function DiffBar({
  added,
  removed,
  className,
  children,
  ...rest
}: ComponentProps<"div"> & { added: number; removed: number }) {
  const { mode, setMode } = useContext(DiffCtx);
  return (
    <div data-slot="diff-bar" className={cx("fg-diff-bar", className)} {...rest}>
      <span className="fg-diff-stats">
        <b className="fg-diff-plus">+{added}</b>
        <b className="fg-diff-minus">−{removed}</b>
      </span>
      {children ?? (
        <Segmented
          label="Layout"
          value={mode}
          onChange={(v) => setMode(v as DiffMode)}
          options={[
            { value: "unified", label: "Unified" },
            { value: "split", label: "Split" },
          ]}
        />
      )}
    </div>
  );
}

/** What the view says when the two sides are the same. */
export function DiffSame({ className, ...rest }: ComponentProps<"p">) {
  return (
    <p data-slot="diff-same" role="status" className={cx("fg-diff-same", className)} {...rest} />
  );
}

/** The table of lines, laid out for the context's mode; its children are DiffHunk elements. */
export function DiffTable({
  mode: modeProp,
  className,
  children,
  ...rest
}: ComponentProps<"table"> & { mode?: DiffMode }) {
  const ctx = useContext(DiffCtx);
  const mode = modeProp ?? ctx.mode;
  return (
    <table
      data-slot="diff-table"
      {...rest}
      className={cx(
        "fg-diff-table",
        mode === "unified" ? "fg-diff-unified" : "fg-diff-split",
        className,
      )}
    >
      <caption className="fg-visually-hidden">
        Changes from {ctx.beforeLabel} to {ctx.afterLabel}
      </caption>
      <colgroup>
        {mode === "unified" ? (
          <>
            <col className="fg-diff-col-no" />
            <col className="fg-diff-col-no" />
            <col className="fg-diff-col-sign" />
            <col />
          </>
        ) : (
          <>
            <col className="fg-diff-col-no" />
            <col className="fg-diff-col-sign" />
            <col />
            <col className="fg-diff-col-no" />
            <col className="fg-diff-col-sign" />
            <col />
          </>
        )}
      </colgroup>
      {mode === "split" ? (
        <thead>
          <tr>
            <th colSpan={3} scope="colgroup" className="fg-diff-side">
              {ctx.beforeLabel}
            </th>
            <th colSpan={3} scope="colgroup" className="fg-diff-side">
              {ctx.afterLabel}
            </th>
          </tr>
        </thead>
      ) : null}
      {children}
    </table>
  );
}

/** A run of lines: the body of a DiffTable. */
export function DiffHunk(props: ComponentProps<"tbody">) {
  return <tbody data-slot="diff-hunk" {...props} />;
}

export interface DiffLineProps extends Omit<ComponentProps<"tr">, "children"> {
  kind: "add" | "del" | "same";
  /** Line number on the older side. */
  aNo?: number;
  /** Line number on the newer side. */
  bNo?: number;
  /** The line's text; with `pieces`, the changed words are marked. */
  text?: string;
  pieces?: ReadonlyArray<StructureDiffPiece>;
  /** Replaces the text. */
  children?: ReactNode;
}

/** One line of a unified diff: numbers, a sign and the text. */
export function DiffLine({
  kind,
  aNo,
  bNo,
  text = "",
  pieces: parts,
  className,
  children,
  ...rest
}: DiffLineProps) {
  const sign = kind === "add" ? "+" : kind === "del" ? "−" : " ";
  return (
    <tr data-slot="diff-line" {...rest} className={cx("fg-diff-row", `fg-diff-${kind}`, className)}>
      <td className="fg-diff-no">{aNo ?? ""}</td>
      <td className="fg-diff-no">{bNo ?? ""}</td>
      <td
        className="fg-diff-sign"
        aria-label={kind === "add" ? "Added" : kind === "del" ? "Removed" : undefined}
      >
        {sign}
      </td>
      <td className="fg-diff-text">
        {children ??
          (kind === "same" ? text || " " : pieces(text, parts, kind === "add" ? "ins" : "del"))}
      </td>
    </tr>
  );
}

export interface DiffSplitSide {
  no: number;
  text: string;
  pieces?: ReadonlyArray<StructureDiffPiece> | undefined;
}

/** One row of a split diff: the older line on the left, the newer on the right, either may be missing. */
export function DiffSplitLine({
  left,
  right,
  className,
  ...rest
}: Omit<ComponentProps<"tr">, "children"> & {
  left?: (DiffSplitSide & { kind?: "del" | "same" }) | null | undefined;
  right?: (DiffSplitSide & { kind?: "add" | "same" }) | null | undefined;
}) {
  const del = left?.kind === "del";
  const add = right?.kind === "add";
  return (
    <tr data-slot="diff-split-line" {...rest} className={cx("fg-diff-row", className)}>
      <td className={cx("fg-diff-no", del && "fg-diff-del")}>{left?.no ?? ""}</td>
      <td
        className={cx("fg-diff-sign", del && "fg-diff-del")}
        aria-label={del ? "Removed" : undefined}
      >
        {del ? "−" : ""}
      </td>
      <td className={cx("fg-diff-text", del && "fg-diff-del", !left && "fg-diff-blank")}>
        {left ? pieces(left.text, left.pieces, "del") : ""}
      </td>
      <td className={cx("fg-diff-no fg-diff-gap", add && "fg-diff-add")}>{right?.no ?? ""}</td>
      <td
        className={cx("fg-diff-sign", add && "fg-diff-add")}
        aria-label={add ? "Added" : undefined}
      >
        {add ? "+" : ""}
      </td>
      <td className={cx("fg-diff-text", add && "fg-diff-add", !right && "fg-diff-blank")}>
        {right ? pieces(right.text, right.pieces, "ins") : ""}
      </td>
    </tr>
  );
}

/** A folded run of unchanged lines; the button unfolds it. */
export function DiffFold({
  count,
  onUnfold,
  span,
  className,
  ...rest
}: Omit<ComponentProps<"tr">, "children"> & {
  /** The number of unchanged lines folded. */
  count: number;
  onUnfold: () => void;
  /** Columns to span; default 4 for the unified layout, 6 when split. */
  span?: number;
}) {
  const { mode } = useContext(DiffCtx);
  return (
    <tr data-slot="diff-fold" {...rest} className={cx("fg-diff-foldrow", className)}>
      <td colSpan={span ?? (mode === "unified" ? 4 : 6)}>
        <button type="button" className="fg-diff-fold" onClick={onUnfold}>
          <Icon icon={ArrowRight01Icon} size={12} variant="mono" />
          {count} unchanged lines
        </button>
      </td>
    </tr>
  );
}

function DiffText({
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
  const fold = (row: Extract<StructureDiffRow, { kind: "fold" }>) => (
    <DiffFold key={row.id} count={row.count} onUnfold={() => unfold(row.id)} />
  );

  return (
    <DiffRoot
      mode={view}
      onModeChange={setView}
      beforeLabel={beforeLabel}
      afterLabel={afterLabel}
      {...(className ? { className } : {})}
    >
      {bare ? null : <DiffBar added={stats.added} removed={stats.removed} />}
      {unchanged ? (
        <DiffSame>{same ?? "No difference."}</DiffSame>
      ) : view === "unified" ? (
        <DiffTable>
          <DiffHunk>
            {rows.map((row, i) =>
              row.kind === "fold" ? (
                fold(row)
              ) : (
                <DiffLine
                  key={i}
                  kind={row.kind}
                  text={row.text}
                  {...("aNo" in row ? { aNo: row.aNo } : {})}
                  {...("bNo" in row ? { bNo: row.bNo } : {})}
                  {...("pieces" in row && row.pieces ? { pieces: row.pieces } : {})}
                />
              ),
            )}
          </DiffHunk>
        </DiffTable>
      ) : (
        <DiffTable>
          <DiffHunk>
            {structureSplitRows(rows).map((row, i) =>
              row.fold ? (
                fold(row.fold)
              ) : (
                <DiffSplitLine key={i} left={row.left} right={row.right} />
              ),
            )}
          </DiffHunk>
        </DiffTable>
      )}
    </DiffRoot>
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

/** The parts form of FieldDiff: a FieldDiffTable of FieldDiffRow elements, as children. */
export interface FieldDiffRootProps extends Omit<ComponentProps<"div">, "children"> {
  before?: undefined;
  after?: undefined;
  children?: ReactNode;
}

const STATUS_WORD: Record<StructureFieldChange["status"], string> = {
  added: "Added",
  removed: "Removed",
  changed: "Changed",
  same: "Unchanged",
};

/**
 * The fields of two records: what each one was, and what it became. With `before` and `after` it
 * builds itself; without, compose FieldDiffTable and FieldDiffRow from `structureDiffFields`.
 */
export function FieldDiff(props: FieldDiffProps | FieldDiffRootProps) {
  if (props.before === undefined) {
    const { before: _b, after: _a, className, children, ...rest } = props as FieldDiffRootProps;
    return (
      <div data-slot="field-diff" {...rest} className={cx("fg-fdiff", className)}>
        {children}
      </div>
    );
  }
  return <FieldDiffRecords {...(props as FieldDiffProps)} />;
}

function FieldDiffRecords({
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
    <FieldDiff {...(className ? { className } : {})}>
      {changed.length === 0 ? <DiffSame>{same ?? "No field changed."}</DiffSame> : null}
      {rows.length > 0 ? (
        <FieldDiffTable beforeLabel={beforeLabel} afterLabel={afterLabel}>
          {rows.map((c) => (
            <FieldDiffRow
              key={c.key}
              change={c}
              {...(labels[c.key] ? { label: labels[c.key] } : {})}
            />
          ))}
        </FieldDiffTable>
      ) : null}
      {hidden > 0 ? (
        <Button size="sm" variant="ghost" onClick={() => setAll((v) => !v)} aria-pressed={all}>
          {all ? "Hide unchanged" : `Show ${hidden} unchanged`}
        </Button>
      ) : null}
    </FieldDiff>
  );
}

/** The table of fields, with its header; its children are FieldDiffRow elements. */
export function FieldDiffTable({
  beforeLabel = "Before",
  afterLabel = "After",
  className,
  children,
  ...rest
}: ComponentProps<"table"> & { beforeLabel?: string; afterLabel?: string }) {
  return (
    <table data-slot="field-diff-table" {...rest} className={cx("fg-fdiff-table", className)}>
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
      <tbody>{children}</tbody>
    </table>
  );
}

/** One field: its name, what it was and what it became. */
export function FieldDiffRow({
  change: c,
  label,
  className,
  ...rest
}: Omit<ComponentProps<"tr">, "children"> & {
  change: StructureFieldChange;
  /** The name shown; the key by default. */
  label?: string | undefined;
}) {
  return (
    <tr
      data-slot="field-diff-row"
      {...rest}
      className={cx("fg-fdiff-row", `fg-fdiff-${c.status}`, className)}
    >
      <th scope="row" className="fg-fdiff-key">
        {label ?? c.key}
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

/**
 * The parts form of VersionCompare: the two picked ids are its state (give `defaultFrom` and
 * `defaultTo`), VersionCompareList and VersionCompareView take the versions.
 */
export interface VersionCompareRootProps extends Omit<ComponentProps<"div">, "children"> {
  versions?: undefined;
  from?: string;
  defaultFrom?: string;
  onFromChange?: (id: string) => void;
  to?: string;
  defaultTo?: string;
  onToChange?: (id: string) => void;
  onRestore?: (id: string) => void;
  children?: ReactNode;
}

interface CompareContext {
  left: string;
  right: string;
  setLeft: (id: string) => void;
  setRight: (id: string) => void;
  onRestore?: ((id: string) => void) | undefined;
}

const CompareCtx = createContext<CompareContext>({
  left: "",
  right: "",
  setLeft: () => {},
  setRight: () => {},
});

/**
 * The versions of a document or record in a list; pick two and see what changed between them.
 * With `versions` it builds itself; without, compose VersionCompareList and VersionCompareView.
 */
export function VersionCompare(props: VersionCompareProps | VersionCompareRootProps) {
  return props.versions === undefined ? (
    <CompareRoot {...(props as VersionCompareRootProps)} />
  ) : (
    <CompareVersions {...(props as VersionCompareProps)} />
  );
}

function CompareRoot({
  versions: _versions,
  from,
  defaultFrom = "",
  onFromChange,
  to,
  defaultTo = "",
  onToChange,
  onRestore,
  className,
  children,
  ...rest
}: VersionCompareRootProps) {
  const [right, setRight] = useControllableState<string>({
    value: to,
    defaultValue: defaultTo,
    onChange: onToChange,
  });
  const [left, setLeft] = useControllableState<string>({
    value: from,
    defaultValue: defaultFrom,
    onChange: onFromChange,
  });
  return (
    <CompareCtx.Provider value={{ left, right, setLeft, setRight, onRestore }}>
      <div data-slot="version-compare" {...rest} className={cx("fg-vcmp", className)}>
        {children}
      </div>
    </CompareCtx.Provider>
  );
}

function CompareVersions({
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
  return (
    <CompareRoot
      defaultFrom={defaultFrom ?? versions[1]?.id ?? versions[0]?.id ?? ""}
      defaultTo={defaultTo ?? versions[0]?.id ?? ""}
      {...(from !== undefined ? { from } : {})}
      {...(to !== undefined ? { to } : {})}
      {...(onFromChange ? { onFromChange } : {})}
      {...(onToChange ? { onToChange } : {})}
      {...(onRestore ? { onRestore } : {})}
      {...(className ? { className } : {})}
    >
      <VersionCompareList versions={versions} />
      <VersionCompareView
        versions={versions}
        {...(labels ? { labels } : {})}
        {...(mode ? { mode } : {})}
        {...(defaultMode ? { defaultMode } : {})}
        {...(onModeChange ? { onModeChange } : {})}
      />
    </CompareRoot>
  );
}

/** The versions as a list, each with its From and To buttons. */
export function VersionCompareList({
  versions,
  className,
  children,
  ...rest
}: Omit<ComponentProps<"ol">, "children"> & {
  versions: ReadonlyArray<CompareVersion>;
  /** Replaces the default rows. */
  children?: ReactNode;
}) {
  return (
    <ol
      data-slot="version-compare-list"
      aria-label="Versions"
      {...rest}
      className={cx("fg-vcmp-list", className)}
    >
      {children ??
        versions.map((v, i) => <VersionCompareItem key={v.id} version={v} current={i === 0} />)}
    </ol>
  );
}

/** One version: its label, author and note, and the buttons that pick it as a side. */
export function VersionCompareItem({
  version: v,
  current = false,
  className,
  ...rest
}: Omit<ComponentProps<"li">, "children"> & {
  version: CompareVersion;
  /** The newest version: shown as "Current version" and never restorable. */
  current?: boolean;
}) {
  const { left, right, setLeft, setRight, onRestore } = useContext(CompareCtx);
  return (
    <li
      data-slot="version-compare-item"
      {...rest}
      className={cx(
        "fg-vcmp-row",
        (v.id === left || v.id === right) && "fg-vcmp-picked",
        className,
      )}
    >
      <span className="fg-vcmp-label">{v.label}</span>
      <div className="fg-vcmp-text">
        <b>{current ? "Current version" : v.at}</b>
        <span className="fg-vcmp-by">
          <Avatar name={v.by} size={16} />
          {v.by}
          {current ? ` · ${v.at}` : ""}
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
        {onRestore && !current ? (
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
  );
}

/** The title and the diff of the two picked versions. */
export function VersionCompareView({
  versions,
  labels,
  mode,
  defaultMode,
  onModeChange,
  className,
  ...rest
}: Omit<ComponentProps<"div">, "children"> & {
  versions: ReadonlyArray<CompareVersion>;
  labels?: Readonly<Record<string, string>>;
  mode?: DiffMode;
  defaultMode?: DiffMode;
  onModeChange?: (mode: DiffMode) => void;
}) {
  const { left, right } = useContext(CompareCtx);
  const a = versions.find((v) => v.id === left);
  const b = versions.find((v) => v.id === right);

  const body = () => {
    if (!a || !b) return <p className="fg-diff-same">Pick two versions.</p>;
    if (a.id === b.id) return <DiffSame>Pick two different versions.</DiffSame>;
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
    <div data-slot="version-compare-view" {...rest} className={cx("fg-vcmp-view", className)}>
      {a && b ? (
        <h3 className="fg-vcmp-title">
          {a.label}
          <Icon icon={ArrowRight01Icon} size={12} variant="mono" />
          {b.label}
        </h3>
      ) : null}
      {body()}
    </div>
  );
}
