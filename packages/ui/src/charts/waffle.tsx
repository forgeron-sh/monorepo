// Shares as squares: a grid of a hundred (by default), each square one part of the whole, each
// slice in its own pixel pattern. Easier to count than a ring: "about a third" is three rows and a
// bit. The key gives value and share and spotlights a slice; hovering a square does too.
//
// Two shapes under one name, as the Donut: with no children, `Waffle` draws the grid, its key and
// the note; with children, it is the root of the parts (`WaffleGrid`, `WaffleKey`, `WaffleNote`),
// which read the slices from it. The table read aloud is always there.

import {
  createContext,
  useContext,
  useId,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type PointerEvent,
  type ReactNode,
} from "react";
import { cx } from "../cx";
import { useChartApi } from "./chart";
import { dashboardFormatPercent, dashboardPercent, dashboardWaffle } from "./model";
import {
  ChartTable,
  colorStyle,
  DashLegend,
  dashColor,
  dashSeries,
  dashSeriesIndexes,
  slicesFrom,
  useConfigColor,
  useConfigName,
  type SliceData,
} from "./parts";

export interface WaffleItem {
  label: string;
  value: number;
}

export interface WaffleProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  /** Names the chart; also its caption. */
  title: string;
  /** One slice each. Or give `data` with `dataKey` and `nameKey`, as shadcn's `Pie`. */
  items?: ReadonlyArray<WaffleItem>;
  data?: SliceData["data"];
  dataKey?: string;
  nameKey?: string;
  /** Writes a value. */
  format?: (value: number) => string;
  /** The label of the slice drawn in ember; the others share the greys. */
  highlight?: string;
  /** Squares in the grid, filled in reading order. Default 100. */
  cells?: number;
  /** Squares per row. Default 10. */
  columns?: number;
  /** Side of a square in px. Default 14. */
  cell?: number;
  /** The parts: `WaffleGrid`, `WaffleKey`, `WaffleNote`, laid out as you like. */
  children?: ReactNode;
}

interface Slice {
  item: WaffleItem;
  k: number;
  name: ReactNode;
  color: string | undefined;
  share: string;
}

interface WaffleApi {
  title: string;
  slices: ReadonlyArray<Slice>;
  /** Squares, in reading order: the index of their slice, or `null` for an empty one. */
  squares: ReadonlyArray<number | null>;
  cells: number;
  columns: number;
  cell: number;
  total: number;
  format: (value: number) => string;
  /** The slice lit by the pointer, else the one spotlighted from the key. */
  lit: string | null;
  spot: string | null;
  setSpot: (label: string | null) => void;
  /** Reads slice `at` (`null`: none): lights it and reports it to the tooltip. */
  read: (at: number | null, event?: PointerEvent<Element>) => void;
}

const WaffleContext = createContext<WaffleApi | null>(null);

function useWaffle(part: string): WaffleApi {
  const api = useContext(WaffleContext);
  if (!api) throw new Error(`${part} must be used within a <Waffle />`);
  return api;
}

/** Parts of a whole as a grid of squares, with a key that gives value and share. */
export function Waffle({
  title,
  items,
  data,
  dataKey,
  nameKey,
  format = String,
  highlight,
  cells = 100,
  columns = 10,
  cell = 14,
  className,
  children,
  ...rest
}: WaffleProps) {
  const configColor = useConfigColor();
  const configName = useConfigName();
  const id = useId();
  const chart = useChartApi();
  const [spot, setSpot] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const list = slicesFrom({ items, data, dataKey, nameKey });
  const total = list.reduce((sum, i) => sum + Math.max(0, i.value), 0);
  const counts = dashboardWaffle(
    list.map((i) => i.value),
    cells,
  );
  const ks = dashSeriesIndexes(
    list.map((i) => i.label),
    highlight,
  );
  const slices: Slice[] = list.map((item, i) => ({
    item,
    k: ks[i]!,
    name: configName(item.label),
    color: configColor(item.label),
    share: dashboardFormatPercent(dashboardPercent(item.value, total)),
  }));
  const squares: Array<number | null> = [];
  counts.forEach((n, at) => {
    for (let j = 0; j < n; j += 1) squares.push(at);
  });
  while (squares.length < cells) squares.push(null);

  const read = (at: number | null, event?: PointerEvent<Element>) => {
    const s = at === null ? undefined : slices[at];
    setHover(s?.item.label ?? null);
    chart?.report(
      s
        ? {
            label: title,
            payload: [
              {
                dataKey: s.item.label,
                name: s.name,
                value: `${format(s.item.value)} · ${s.share}`,
                color: dashColor(s.k, s.item.label),
                payload: s.item,
              },
            ],
          }
        : null,
      event,
    );
  };
  const api: WaffleApi = {
    title,
    slices,
    squares,
    cells,
    columns,
    cell,
    total,
    format,
    lit: hover ?? spot,
    spot,
    setSpot,
    read,
  };

  return (
    <WaffleContext.Provider value={api}>
      <figure className={cx("fg-dash-waffle", className)} {...rest}>
        <figcaption className="fg-dash-title" id={`${id}-title`}>
          {title}
        </figcaption>
        {children !== undefined ? (
          <div className="fg-dash-waffle-body">{children}</div>
        ) : (
          <>
            <div className="fg-dash-waffle-body">
              <WaffleGrid />
              <WaffleKey />
            </div>
            <WaffleNote />
          </>
        )}
        <ChartTable
          caption={title}
          columns={["Slice", "Value", "Share"]}
          rows={slices.map((s) => ({
            key: s.item.label,
            head: s.name,
            cells: [format(s.item.value), s.share],
          }))}
        />
      </figure>
    </WaffleContext.Provider>
  );
}

export interface WaffleGridProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  /** Squares per row, over the root's `columns`. */
  columns?: number;
  /** Side of a square in px, over the root's `cell`. */
  cell?: number;
}

/** The grid: one square per part, in its slice's pattern; the slice under the pointer stands. */
export function WaffleGrid({ columns, cell, className, style, ...rest }: WaffleGridProps) {
  const waffle = useWaffle("WaffleGrid");
  const { slices, lit } = waffle;
  return (
    <div
      className={cx("fg-dash-waffle-grid", className)}
      style={
        {
          "--fg-waffle-cols": columns ?? waffle.columns,
          "--fg-waffle-cell": `${cell ?? waffle.cell}px`,
          ...style,
        } as CSSProperties
      }
      aria-hidden="true"
      onPointerLeave={() => waffle.read(null)}
      {...rest}
    >
      {waffle.squares.map((at, i) =>
        at !== null ? (
          <span
            key={i}
            className={cx(
              "fg-dash-waffle-cell",
              dashSeries(slices[at]!.k),
              lit !== null && lit !== slices[at]!.item.label && "fg-dash-dim",
            )}
            style={colorStyle(slices[at]!.color)}
            onPointerMove={(event) => waffle.read(at, event)}
          />
        ) : (
          <span key={i} className="fg-dash-waffle-cell fg-dash-waffle-empty" />
        ),
      )}
    </div>
  );
}

export interface WaffleKeyProps {
  className?: string;
  /** Leaves the shares out of the key. */
  hideShare?: boolean;
}

/** The key: swatch, name, value and share of each slice; a button spotlights its slice. */
export function WaffleKey({ className, hideShare = false }: WaffleKeyProps) {
  const waffle = useWaffle("WaffleKey");
  const { slices, format } = waffle;
  return (
    <DashLegend
      label={`${waffle.title}: key`}
      className={className}
      entries={slices.map((s) => ({
        key: s.item.label,
        label: s.name,
        k: s.k,
        color: s.color,
        value: format(s.item.value),
        ...(hideShare ? {} : { share: s.share }),
      }))}
      off={waffle.spot === null ? [] : [waffle.spot]}
      pressedMeans="spotlight"
      onHover={(key, event) =>
        waffle.read(key === null ? null : slices.findIndex((s) => s.item.label === key), event)
      }
      onToggle={(key) => waffle.setSpot(waffle.spot === key ? null : key)}
    />
  );
}

/** What one square is worth: `One square is 1% of 850.`; children replace the sentence. */
export function WaffleNote({ className, children, ...rest }: HTMLAttributes<HTMLParagraphElement>) {
  const waffle = useWaffle("WaffleNote");
  return (
    <p className={cx("fg-dash-waffle-note", className)} {...rest}>
      {children ?? (
        <>
          One square is{" "}
          {dashboardFormatPercent(1 / Math.max(1, waffle.cells), {
            digits: waffle.cells > 100 ? 1 : 0,
          })}{" "}
          of {waffle.format(waffle.total)}.
        </>
      )}
    </p>
  );
}
