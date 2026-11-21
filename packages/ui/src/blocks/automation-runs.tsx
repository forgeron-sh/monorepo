// The runs of automations, after the Executions views of the Flows prototype: a list grouped by
// day under a closed band (state in a word and an LED, time, number, what started it, the error
// in one line, the duration), and the pixel bars of the runs of the last days, failures in red.
//
// `RunList` draws itself from `runs`; given children, they are the parts (the runs stay in the
// root: its collection needs them for the keyboard):
//
//   <RunList runs={runs} selected={id} onSelect={setId} filter>
//     <RunListFilter />
//     <RunListDays />
//   </RunList>

import type { IconDefinition } from "@forgeron/icons";
import {
  createContext,
  useContext,
  useState,
  type ComponentProps,
  type ReactNode,
  type SVGProps,
} from "react";
import { Segmented, SegmentedItem } from "../controls";
import { cx } from "../cx";
import { dayLabel, groupByDay } from "../dates";
import { useCollection, type Collection } from "../hooks/use-collection";
import { Icon } from "../icon";
import { Led } from "../led";
import { renderPart } from "../part";
import { Feed, FeedGroup, FeedGroupLabel, FeedItem, FeedTime } from "../timeline";
import { formatDuration, statusLook, type RunStatus } from "./automation-model";

/* ---------------------------------------------------------------- RunBars */

export interface RunBarsProps extends Omit<SVGProps<SVGSVGElement>, "className" | "values"> {
  /** Runs per period, oldest first. */
  values: ReadonlyArray<number>;
  /** Failed runs per period, drawn in red over the bar. */
  errors?: ReadonlyArray<number>;
  width?: number;
  height?: number;
  /** Names the bars (`Runs, last 14 days`); without it they are decorative. */
  label?: string;
  className?: string;
}

/** Bars of scanlines, one per period; a period without runs is a flat line; failures in red. */
export function RunBars({
  values,
  errors,
  width = 112,
  height = 24,
  label,
  className,
  ...rest
}: RunBarsProps) {
  const n = Math.max(values.length, 1);
  const bw = Math.max(1, Math.floor(width / n) - 1);
  const max = Math.max(...values, 1);
  let empty = "";
  let bars = "";
  let failed = "";
  values.forEach((v, i) => {
    const x = i * (bw + 1);
    if (!v) {
      empty += `M${x} ${height - 1}h${bw}v1h-${bw}z`;
      return;
    }
    const bh = Math.max(2, Math.round((v / max) * (height - 2)));
    for (let y = height - bh; y < height; y += 2) bars += `M${x} ${y}h${bw}v1h-${bw}z`;
    const e = errors?.[i] ?? 0;
    if (e > 0) {
      const eh = Math.max(3, Math.round((Math.min(v, Math.max(e, v * 0.25)) / max) * (height - 2)));
      for (let y = height - eh; y < height; y++) failed += `M${x} ${y}h${bw}v1h-${bw}z`;
    }
  });
  const total = values.reduce((a, b) => a + b, 0);
  const fails = (errors ?? []).reduce((a, b) => a + b, 0);
  return (
    <svg
      data-slot="run-bars"
      viewBox={`0 0 ${n * (bw + 1)} ${height}`}
      width={width}
      height={height}
      preserveAspectRatio="none"
      shapeRendering="crispEdges"
      {...(label
        ? { role: "img", "aria-label": `${label}: ${total} runs, ${fails} failed` }
        : { "aria-hidden": true })}
      {...rest}
      className={cx("fg-runbars", className)}
    >
      <path className="fg-runbars-empty" d={empty} />
      <path className="fg-runbars-ok" d={bars} />
      {failed ? <path className="fg-runbars-fail" d={failed} /> : null}
    </svg>
  );
}

/* ---------------------------------------------------------------- RunList */

export interface RunSummary {
  id: string;
  status: RunStatus;
  /** Start, local time: `YYYY-MM-DD HH:MM:SS` (or `HH:MM`). */
  at: string;
  durationMs?: number;
  /** What started it: `Schedule`, `Manual · Camille`, `Retry of #1204`. */
  trigger?: { label: string; icon?: IconDefinition };
  /** The automation, for a list across automations. */
  automation?: string;
  /** One line: the error of a failed run (`Send invoice: 503 from upstream`), else a summary. */
  detail?: string;
}

interface RunListContext {
  /** The runs shown: those of the root, after the Failed filter. */
  runs: ReadonlyArray<RunSummary>;
  collection: Collection;
  selected: string | null | undefined;
  onSelect: ((id: string) => void) | undefined;
  today: string | undefined;
  density: "full" | "compact";
  empty: ReactNode;
  filter: boolean;
  only: string;
  setOnly: (only: string) => void;
}

const Ctx = createContext<RunListContext | null>(null);

/** The list a part is in. */
export function useRunList(part = "useRunList"): RunListContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error(`<${part}> goes inside a <RunList>.`);
  return ctx;
}

interface RunItem {
  run: RunSummary;
  day: string;
}
const ItemCtx = createContext<RunItem | null>(null);

function useRun(part: string): RunItem {
  const item = useContext(ItemCtx);
  if (!item) throw new Error(`<${part}> goes inside a <RunListItem>.`);
  return item;
}

export interface RunListProps extends Omit<ComponentProps<"section">, "className" | "onSelect"> {
  /** Newest first. */
  runs: ReadonlyArray<RunSummary>;
  selected?: string | null;
  onSelect?: (id: string) => void;
  /** YYYY-MM-DD: its day and the day before read Today and Yesterday. */
  today?: string;
  /** The All / Failed switch above the list. */
  filter?: boolean;
  /** `compact`: time, state and duration only, for a column next to a run. */
  density?: "full" | "compact";
  label?: string;
  empty?: ReactNode;
  className?: string;
  asChild?: boolean;
}

/** Runs by day, newest first: state, time, number, trigger, error, duration. */
export function RunList({
  runs,
  selected,
  onSelect,
  today,
  filter = false,
  density = "full",
  label = "Runs",
  empty = "No run yet",
  className,
  asChild,
  children,
  ...rest
}: RunListProps) {
  const [only, setOnly] = useState("all");
  const list = filter && only === "error" ? runs.filter((r) => r.status === "error") : runs;

  // Up and Down move between the run buttons; what is selected is the caller's (`aria-current`).
  const collection = useCollection({
    items: list,
    getId: (run) => run.id,
    selectionMode: "none",
    actOnDoubleClick: false,
  });
  const ctx: RunListContext = {
    runs: list,
    collection,
    selected,
    onSelect,
    today,
    density,
    empty,
    filter,
    only,
    setOnly,
  };
  return (
    <Ctx.Provider value={ctx}>
      {renderPart(
        "section",
        cx("fg-runs", density === "compact" && "fg-runs-compact", className),
        asChild,
        {
          "data-slot": "run-list",
          "aria-label": label,
          ...rest,
          children: children ?? (
            <>
              <RunListFilter />
              <RunListEmpty />
              <RunListDays />
            </>
          ),
        },
      )}
    </Ctx.Provider>
  );
}

/* ---------------------------------------------------------------- parts */

/** The All / Failed switch. Nothing unless the root has `filter`. */
export function RunListFilter({ className, ...rest }: ComponentProps<"div">) {
  const { filter, only, setOnly } = useRunList("RunListFilter");
  if (!filter) return null;
  return (
    <div data-slot="run-list-filter" {...rest} className={cx("fg-runs-bar", className)}>
      <Segmented label="Show" value={only} onChange={setOnly}>
        <SegmentedItem value="all">All</SegmentedItem>
        <SegmentedItem value="error">Failed</SegmentedItem>
      </Segmented>
    </div>
  );
}

/** What an empty list says. Nothing while there are runs. */
export function RunListEmpty({ className, children, ...rest }: ComponentProps<"div">) {
  const { runs, empty } = useRunList("RunListEmpty");
  if (runs.length > 0) return null;
  return (
    <div data-slot="run-list-empty" {...rest} className={cx("fg-runs-empty", className)}>
      {children ?? empty}
    </div>
  );
}

/** The runs, a `RunListGroup` per day. It holds the keyboard of the list. */
export function RunListDays({ children, ...rest }: ComponentProps<"div">) {
  const { runs, collection } = useRunList("RunListDays");
  return (
    <div data-slot="run-list-days" {...rest} {...collection.getContainerProps()}>
      {children ??
        groupByDay(runs, (run) => run.at).map(({ day, items }) => (
          <RunListGroup key={day} day={day} runs={items} />
        ))}
    </div>
  );
}

export interface RunListGroupProps extends Omit<ComponentProps<"div">, "children"> {
  /** `YYYY-MM-DD`. */
  day: string;
  runs: ReadonlyArray<RunSummary>;
  children?: ReactNode;
}

/** One day under its band, and its runs. */
export function RunListGroup({ day, runs, className, children, ...rest }: RunListGroupProps) {
  const { today } = useRunList("RunListGroup");
  return (
    <FeedGroup data-slot="run-list-group" {...rest} className={className}>
      <FeedGroupLabel>{dayLabel(day, today)}</FeedGroupLabel>
      <Feed connector={false} className="fg-runs-list">
        {children ?? runs.map((run) => <RunListItem key={run.id} run={run} day={day} />)}
      </Feed>
    </FeedGroup>
  );
}

export interface RunListItemProps extends Omit<ComponentProps<"li">, "children"> {
  run: RunSummary;
  /** `YYYY-MM-DD`: the day of its group, for the time. Default the day of the run. */
  day?: string;
  children?: ReactNode;
}

/** One run: its row, a button when the root has `onSelect`. */
export function RunListItem({ run, day, className, children, ...rest }: RunListItemProps) {
  return (
    <ItemCtx.Provider value={{ run, day: day ?? run.at.slice(0, 10) }}>
      <FeedItem
        data-slot="run-list-item"
        {...rest}
        className={cx(run.status === "error" && "fg-runs-failed", className)}
      >
        {children ?? <RunListRow />}
      </FeedItem>
    </ItemCtx.Provider>
  );
}

/** The line of a run: a button of the collection with `onSelect`, a plain row without. */
export function RunListRow({ className, children, onClick, ...rest }: ComponentProps<"button">) {
  const { collection, selected, onSelect, density } = useRunList("RunListRow");
  const { run } = useRun("RunListRow");
  const line = children ?? (
    <>
      <RunListState />
      <RunListTime />
      <RunListId />
      {density === "full" ? <RunListWhat /> : null}
      <RunListDuration />
    </>
  );
  if (!onSelect) {
    return (
      <div
        data-slot="run-list-row"
        {...(rest as ComponentProps<"div">)}
        className={cx("fg-runs-row", className)}
      >
        {line}
      </div>
    );
  }
  return (
    <button
      type="button"
      data-slot="run-list-row"
      {...rest}
      {...collection.getItemProps(run.id)}
      className={cx("fg-runs-row", className)}
      aria-current={selected === run.id ? "true" : undefined}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) onSelect(run.id);
      }}
    >
      {line}
    </button>
  );
}

/** The state in a word and an LED; the word is for screen readers in the compact density. */
export function RunListState({ className, ...rest }: ComponentProps<"span">) {
  const { density } = useRunList("RunListState");
  const { run } = useRun("RunListState");
  const look = statusLook(run.status);
  return (
    <span data-slot="run-list-state" {...rest} className={cx("fg-runs-state", className)}>
      <Led tone={look.tone} />
      <span className={density === "compact" ? "fg-sr" : undefined}>{look.word}</span>
    </span>
  );
}

/** When it started. */
export function RunListTime({ className, ...rest }: ComponentProps<"time">) {
  const { run, day } = useRun("RunListTime");
  const time = run.at.slice(11, 19);
  return (
    <FeedTime
      data-slot="run-list-time"
      dateTime={`${day}T${time}`}
      {...rest}
      className={cx("fg-runs-time", className)}
    >
      {time}
    </FeedTime>
  );
}

/** Its number: `#1204`. */
export function RunListId({ className, ...rest }: ComponentProps<"span">) {
  const { run } = useRun("RunListId");
  return (
    <span data-slot="run-list-id" {...rest} className={cx("fg-runs-id", className)}>
      #{run.id}
    </span>
  );
}

/** What it is: the automation, what started it and, under it, its detail or error. */
export function RunListWhat({ className, children, ...rest }: ComponentProps<"span">) {
  const { run } = useRun("RunListWhat");
  return (
    <span data-slot="run-list-what" {...rest} className={cx("fg-runs-what", className)}>
      {children ?? (
        <>
          {run.automation ? <b>{run.automation}</b> : null}
          {run.trigger ? (
            <span className="fg-runs-trigger">
              {run.trigger.icon ? <Icon icon={run.trigger.icon} size={12} variant="mono" /> : null}
              {run.trigger.label}
            </span>
          ) : null}
          {run.detail ? (
            <span
              className={cx("fg-runs-detail", run.status === "error" && "fg-runs-detail-error")}
            >
              {run.detail}
            </span>
          ) : null}
        </>
      )}
    </span>
  );
}

/** How long it took. */
export function RunListDuration({ className, ...rest }: ComponentProps<"span">) {
  const { run } = useRun("RunListDuration");
  return (
    <span data-slot="run-list-duration" {...rest} className={cx("fg-runs-dur", className)}>
      {formatDuration(run.durationMs)}
    </span>
  );
}
