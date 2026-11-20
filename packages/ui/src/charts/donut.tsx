// A donut in pixels: a ring drawn in whole pixels, each slice filled with its own pattern, a key
// that names every slice with its value and share. Never an anti-aliased arc.
//
// Two shapes under one name, as shadcn's: with no children, `Donut` draws the ring and its key;
// with children, it is the root of the parts (`DonutRing`, `DonutCenter`, `DonutKey`), which read
// the slices from it. The data are given once, to the root: a whole is needed to cut the ring, so
// a slice is never a part of its own. The table read aloud is always there.

import {
  createContext,
  useContext,
  useId,
  useMemo,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { cx } from "../cx";
import { useChartApi } from "./chart";
import { dashboardFormatPercent, dashboardPercent, dashboardRing } from "./model";
import {
  ChartTable,
  DashLegend,
  dashColor,
  dashFill,
  dashRingPath,
  dashSeriesIndexes,
  slicesFrom,
  useConfigColor,
  useConfigName,
  type SliceData,
} from "./parts";
import { PX } from "./scale";

export interface DonutItem {
  label: string;
  value: number;
}

export interface DonutProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  /** Names the chart; also its caption. */
  title: string;
  /** One slice each. Or give `data` with `dataKey` and `nameKey`, as shadcn's `Pie`. */
  items?: ReadonlyArray<DonutItem>;
  data?: SliceData["data"];
  dataKey?: string;
  nameKey?: string;
  /** Writes a value. */
  format?: (value: number) => string;
  /** The label of the slice drawn in ember; the others share the greys. */
  highlight?: string;
  /** Width of the ring in px. Default 160. */
  size?: number;
  /** Thickness of the ring in chart pixels (two px each). Default 12. */
  thickness?: number;
  /** In the hole: the total by default. */
  center?: ReactNode;
  /** The parts: `DonutRing`, `DonutCenter`, `DonutKey`, laid out as you like. */
  children?: ReactNode;
}

interface Slice {
  item: DonutItem;
  /** Its pattern and default colour. */
  k: number;
  /** Its name in the key: the config's label, else its own. */
  name: ReactNode;
  /** Its colour from the container's config, if the config names it. */
  color: string | undefined;
  share: number;
}

interface DonutApi {
  title: string;
  slices: ReadonlyArray<Slice>;
  total: number;
  format: (value: number) => string;
  size: number;
  thickness: number;
  /** The slice spotlighted from the key, or none. */
  spot: string | null;
  setSpot: (label: string | null) => void;
}

const DonutContext = createContext<DonutApi | null>(null);

function useDonut(part: string): DonutApi {
  const api = useContext(DonutContext);
  if (!api) throw new Error(`${part} must be used within a <Donut />`);
  return api;
}

/**
 * Slices of a whole. The key beside the ring gives each slice its swatch, value and share; a
 * button in the key spotlights its slice. A table carries the same numbers for assistive
 * technology.
 */
export function Donut({
  title,
  items,
  data,
  dataKey,
  nameKey,
  format = String,
  highlight,
  size = 160,
  thickness = 12,
  center,
  className,
  children,
  ...rest
}: DonutProps) {
  const id = useId();
  const configColor = useConfigColor();
  const configName = useConfigName();
  const [spot, setSpot] = useState<string | null>(null);
  const list = slicesFrom({ items, data, dataKey, nameKey });
  const total = list.reduce((sum, i) => sum + Math.max(0, i.value), 0);
  const ks = dashSeriesIndexes(
    list.map((i) => i.label),
    highlight,
  );
  const slices: Slice[] = list.map((item, i) => ({
    item,
    k: ks[i]!,
    name: configName(item.label),
    color: configColor(item.label),
    share: dashboardPercent(Math.max(0, item.value), total),
  }));
  const api: DonutApi = { title, slices, total, format, size, thickness, spot, setSpot };
  return (
    <DonutContext.Provider value={api}>
      <figure className={cx("fg-dash-donut", className)} {...rest}>
        <figcaption className="fg-dash-title" id={`${id}-title`}>
          {title}
        </figcaption>
        <div className="fg-dash-donut-body">
          {children ?? (
            <>
              <DonutRing>
                {center === undefined ? undefined : <DonutCenter>{center}</DonutCenter>}
              </DonutRing>
              <DonutKey />
            </>
          )}
        </div>
        <ChartTable
          caption={title}
          columns={["Slice", "Value", "Share"]}
          rows={(list.some((i) => i.value > 0) ? slices : []).map((s) => ({
            key: s.item.label,
            head: s.name,
            cells: [format(s.item.value), dashboardFormatPercent(s.share)],
          }))}
        />
      </figure>
    </DonutContext.Provider>
  );
}

export interface DonutRingProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  /** Width of the ring in px, over the root's `size`. */
  size?: number;
  /** Thickness in chart pixels, over the root's `thickness`. */
  thickness?: number;
  /** In the hole; default `<DonutCenter />`, the total. `null` leaves it empty. */
  children?: ReactNode;
}

/** The ring: one path per slice, in its pattern; the spotlighted slice stands, the others dim. */
export function DonutRing({
  size,
  thickness,
  className,
  style,
  children,
  ...rest
}: DonutRingProps) {
  const donut = useDonut("DonutRing");
  const diameter = Math.max(16, Math.round((size ?? donut.size) / PX));
  const thick = Math.min(thickness ?? donut.thickness, diameter / 2);
  const cells = useMemo(() => dashboardRing(diameter, thick), [diameter, thick]);
  const paths = useMemo(
    () =>
      donut.slices.map((slice, i) => {
        const from = donut.slices.slice(0, i).reduce((sum, s) => sum + s.share, 0);
        const own = cells.filter((c) => c.t >= from && c.t < from + slice.share);
        return { slice, d: dashRingPath(own, slice.k) };
      }),
    [donut.slices, cells],
  );
  return (
    <div
      className={cx("fg-dash-ring", className)}
      style={{ width: diameter * PX, height: diameter * PX, ...style }}
      {...rest}
    >
      <svg
        width={diameter * PX}
        height={diameter * PX}
        viewBox={`0 0 ${diameter} ${diameter}`}
        shapeRendering="crispEdges"
        aria-hidden="true"
      >
        {paths.map(({ slice, d }) => (
          <path
            key={slice.item.label}
            d={d}
            className={cx(
              dashFill(slice.k),
              donut.spot !== null && donut.spot !== slice.item.label && "fg-dash-dim",
            )}
            style={slice.color ? { fill: slice.color } : undefined}
          />
        ))}
      </svg>
      {children === undefined ? <DonutCenter /> : children}
    </div>
  );
}

export interface DonutCenterProps extends HTMLAttributes<HTMLSpanElement> {
  /** Under the figure, over `Total`. */
  label?: ReactNode;
  /** The whole content of the hole, over the total and its label. */
  children?: ReactNode;
}

/** The hole of the ring: the total and `Total` by default, or what you put in it. */
export function DonutCenter({ label = "Total", className, children, ...rest }: DonutCenterProps) {
  const donut = useDonut("DonutCenter");
  return (
    <span className={cx("fg-dash-ring-center", className)} {...rest}>
      {children ?? (
        <>
          <b>{donut.format(donut.total)}</b>
          <small>{label}</small>
        </>
      )}
    </span>
  );
}

export interface DonutKeyProps {
  className?: string;
  /** Leaves the shares out of the key. */
  hideShare?: boolean;
}

/**
 * The key: a swatch (pattern and colour), the name, value and share of each slice. A button
 * spotlights its slice; in a `ChartContainer`, the pointer on a slice's line reports it.
 */
export function DonutKey({ className, hideShare = false }: DonutKeyProps) {
  const donut = useDonut("DonutKey");
  const chart = useChartApi();
  const { slices, format, title } = donut;
  return (
    <DashLegend
      label={`${title}: key`}
      className={className}
      entries={slices.map((s) => ({
        key: s.item.label,
        label: s.name,
        k: s.k,
        color: s.color,
        value: format(s.item.value),
        ...(hideShare ? {} : { share: dashboardFormatPercent(s.share) }),
      }))}
      off={donut.spot === null ? [] : [donut.spot]}
      pressedMeans="spotlight"
      onHover={
        chart
          ? (key, event) => {
              const s = slices.find((x) => x.item.label === key);
              chart.report(
                s
                  ? {
                      label: title,
                      payload: [
                        {
                          dataKey: s.item.label,
                          name: s.name,
                          value: `${format(s.item.value)} · ${dashboardFormatPercent(s.share)}`,
                          color: dashColor(s.k, s.item.label),
                          payload: s.item,
                        },
                      ],
                    }
                  : null,
                event,
              );
            }
          : undefined
      }
      onToggle={(key) => donut.setSpot(donut.spot === key ? null : key)}
    />
  );
}
