// shadcn's Chart, without recharts (D-157): `ChartContainer` takes a `config` (a label, a colour and
// an icon per series) and sets `--color-<key>` for each; `ChartTooltip` and `ChartLegend` show what
// the chart under the container reports (hover) and what the config names. Our SVG charts stay
// ours: inside a container they read their colours from the config and report their hover to it;
// outside one they are unchanged.

import {
  cloneElement,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type CSSProperties,
  type HTMLAttributes,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import { cx } from "../cx";

/** What a series is called, how it is drawn and the icon in front of it. */
export interface ChartConfigEntry {
  label?: ReactNode;
  icon?: ComponentType;
  /** Any CSS colour; default: ember first, then the ink tones, success, warning and danger. */
  color?: string;
}

/** One entry per series, by key: `{ views: { label: "Views", color: "var(--accent)" } }`. */
export type ChartConfig = { [key: string]: ChartConfigEntry };

/** The colours a series takes when its config gives none, in order. */
export const CHART_COLORS: ReadonlyArray<string> = [
  "var(--accent)",
  "var(--ink)",
  "var(--ink-muted)",
  "var(--success)",
  "var(--warning)",
  "var(--danger)",
];

/** A key as it is written in a CSS variable name. */
const safeKey = (key: string) => key.replace(/[^\w-]/g, "-");

/** The CSS colour of series `key`, as set by the container: `var(--color-views)`. */
export const chartColor = (key: string, fallback?: string) =>
  fallback ? `var(--color-${safeKey(key)}, ${fallback})` : `var(--color-${safeKey(key)})`;

/** One line of a tooltip, shaped like recharts' payload so shadcn's code reads it as is. */
export interface ChartPayloadItem {
  dataKey?: string;
  name?: ReactNode;
  value?: ReactNode;
  color?: string;
  payload?: unknown;
}

/** What a chart reports when a point is read: the heading and one line per series. */
export interface ChartHover {
  label?: ReactNode;
  payload: ReadonlyArray<ChartPayloadItem>;
}

interface ChartApi {
  config: ChartConfig;
  /** A chart reports the point under the pointer or the focus; `null` when it leaves. */
  report: (hover: ChartHover | null, event?: ReactPointerEvent<Element>) => void;
}

const ApiContext = createContext<ChartApi | null>(null);
const HoverContext = createContext<{
  hover: ChartHover | null;
  at: { x: number; y: number } | null;
}>({ hover: null, at: null });

/** For the charts: the config and the way to report a hover, or `null` outside a container. */
export function useChartApi(): ChartApi | null {
  return useContext(ApiContext);
}

/** shadcn's `useChart`: the config of the container around. */
export function useChart(): { config: ChartConfig } {
  const api = useContext(ApiContext);
  if (!api) throw new Error("useChart must be used within a <ChartContainer />");
  return { config: api.config };
}

export interface ChartContainerProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  config: ChartConfig;
  children?: ReactNode;
}

/**
 * The box around a chart: sets `--color-<key>` from `config` (and the colours of the series by
 * position), holds the tooltip's anchor and carries the config to `ChartTooltip` and `ChartLegend`.
 */
export function ChartContainer({
  config,
  className,
  style,
  children,
  ...rest
}: ChartContainerProps) {
  const box = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<ChartHover | null>(null);
  const [at, setAt] = useState<{ x: number; y: number } | null>(null);
  const report = useCallback<ChartApi["report"]>((next, event) => {
    setHover(next);
    const rect = box.current?.getBoundingClientRect();
    setAt(
      next && event && rect ? { x: event.clientX - rect.left, y: event.clientY - rect.top } : null,
    );
  }, []);
  const api = useMemo(() => ({ config, report }), [config, report]);
  const vars: Record<string, string> = {};
  Object.keys(config).forEach((key, i) => {
    vars[`--color-${safeKey(key)}`] = config[key]?.color ?? CHART_COLORS[i % CHART_COLORS.length]!;
    if (i < CHART_COLORS.length) vars[`--fg-series-${i}`] = `var(--color-${safeKey(key)})`;
  });
  return (
    <ApiContext.Provider value={api}>
      <HoverContext.Provider value={{ hover, at }}>
        <div
          ref={box}
          data-slot="chart"
          className={cx("fg-chart", className)}
          style={{ ...vars, ...style } as CSSProperties}
          {...rest}
        >
          {children}
        </div>
      </HoverContext.Provider>
    </ApiContext.Provider>
  );
}

/* ---------------------------------------------------------------- tooltip */

export interface ChartTooltipContentProps {
  /** Set by `ChartTooltip`. */
  active?: boolean;
  payload?: ReadonlyArray<ChartPayloadItem>;
  label?: ReactNode;
  className?: string;
  hideLabel?: boolean;
  hideIndicator?: boolean;
  /** The mark before each line: a square dot (default), a bar, or a dashed bar. */
  indicator?: "dot" | "line" | "dashed";
  /** Which payload field names the series in the config (default `name`, then `dataKey`). */
  nameKey?: string;
  /** Looks the heading up in the config instead of using the label. */
  labelKey?: string;
  labelClassName?: string;
  labelFormatter?: (label: ReactNode, payload: ReadonlyArray<ChartPayloadItem>) => ReactNode;
  formatter?: (
    value: ReactNode,
    name: ReactNode,
    item: ChartPayloadItem,
    index: number,
    payload: unknown,
  ) => ReactNode;
  /** Colour of every indicator, over the series' own. */
  color?: string;
}

/** shadcn's tooltip body: the heading, then a line per series (mark, name, value). */
export function ChartTooltipContent({
  active = true,
  payload = [],
  label,
  className,
  hideLabel = false,
  hideIndicator = false,
  indicator = "dot",
  nameKey,
  labelKey,
  labelClassName,
  labelFormatter,
  formatter,
  color,
}: ChartTooltipContentProps) {
  const api = useContext(ApiContext);
  const config = api?.config ?? {};
  if (!active || !payload.length) return null;
  const keyOf = (item: ChartPayloadItem) => {
    const named = nameKey ? (item as Record<string, unknown>)[nameKey] : undefined;
    return String(named ?? item.dataKey ?? item.name ?? "value");
  };
  const heading = hideLabel
    ? null
    : labelFormatter
      ? labelFormatter(label, payload)
      : labelKey
        ? (config[labelKey]?.label ?? label)
        : label;
  return (
    <div className={cx("fg-chart-tip", className)} role="status">
      {heading ? <div className={cx("fg-chart-tip-label", labelClassName)}>{heading}</div> : null}
      <div className="fg-chart-tip-items">
        {payload.map((item, index) => {
          const key = keyOf(item);
          const entry = config[key] ?? config[String(item.dataKey ?? "")];
          const Mark = entry?.icon;
          const tint = color ?? item.color ?? chartColor(key, "var(--accent)");
          return (
            <div
              key={`${key}-${index}`}
              className={cx("fg-chart-tip-item", `fg-chart-tip-${indicator}`)}
            >
              {formatter && item.value !== undefined ? (
                formatter(item.value, item.name ?? key, item, index, item.payload)
              ) : (
                <>
                  {Mark ? (
                    <Mark />
                  ) : !hideIndicator ? (
                    <span
                      className="fg-chart-tip-mark"
                      style={{ "--fg-mark": tint } as CSSProperties}
                      aria-hidden="true"
                    />
                  ) : null}
                  <span className="fg-chart-tip-name">{entry?.label ?? item.name ?? key}</span>
                  {item.value !== undefined ? (
                    <span className="fg-chart-tip-value">
                      {typeof item.value === "number" ? item.value.toLocaleString() : item.value}
                    </span>
                  ) : null}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export interface ChartTooltipProps {
  /** The body: `<ChartTooltipContent />` (default) or your own element, given `active`, `payload`, `label`. */
  content?:
    | ReactElement
    | ((props: {
        active: boolean;
        payload: ReadonlyArray<ChartPayloadItem>;
        label?: ReactNode;
      }) => ReactNode);
  className?: string;
  /** Kept for shadcn's code: our charts draw their own cursor. */
  cursor?: unknown;
  defaultIndex?: number;
}

/**
 * Shows what the chart under the container reports: next to the pointer, or in the corner when it
 * is the keyboard that reads. Put it anywhere inside the container.
 */
export function ChartTooltip({ content, className }: ChartTooltipProps) {
  const { hover, at } = useContext(HoverContext);
  if (!hover) return null;
  const props = { active: true, payload: hover.payload, label: hover.label };
  const body =
    typeof content === "function" ? (
      content(props)
    ) : isValidElement(content) ? (
      cloneElement(content as ReactElement<Record<string, unknown>>, props)
    ) : (
      <ChartTooltipContent {...props} />
    );
  return (
    <div
      className={cx("fg-chart-tip-anchor", at && "fg-chart-tip-at", className)}
      style={at ? { left: at.x, top: at.y } : undefined}
    >
      {body}
    </div>
  );
}

/* ---------------------------------------------------------------- legend */

export interface ChartLegendContentProps {
  className?: string;
  /** Set by `ChartLegend`; without it, every series of the config. */
  payload?: ReadonlyArray<ChartPayloadItem>;
  hideIcon?: boolean;
  verticalAlign?: "top" | "bottom";
  nameKey?: string;
}

/** shadcn's legend body: a mark, or the config's icon, and the name of each series. */
export function ChartLegendContent({
  className,
  payload,
  hideIcon = false,
  verticalAlign = "bottom",
  nameKey,
}: ChartLegendContentProps) {
  const api = useContext(ApiContext);
  const config = api?.config ?? {};
  const items: ReadonlyArray<ChartPayloadItem> =
    payload ??
    Object.keys(config).map((key) => ({ dataKey: key, value: key, color: chartColor(key) }));
  if (!items.length) return null;
  return (
    <ul className={cx("fg-chart-legend", `fg-chart-legend-${verticalAlign}`, className)}>
      {items.map((item, index) => {
        const named = nameKey ? (item as Record<string, unknown>)[nameKey] : undefined;
        const key = String(named ?? item.dataKey ?? item.value ?? index);
        const entry = config[key];
        const Mark = entry?.icon;
        return (
          <li key={`${key}-${index}`} className="fg-chart-legend-item">
            {Mark && !hideIcon ? (
              <Mark />
            ) : (
              <span
                className="fg-chart-tip-mark"
                style={
                  { "--fg-mark": item.color ?? chartColor(key, "var(--accent)") } as CSSProperties
                }
                aria-hidden="true"
              />
            )}
            {entry?.label ?? (typeof item.value === "string" ? item.value : key)}
          </li>
        );
      })}
    </ul>
  );
}

export interface ChartLegendProps {
  content?: ReactElement;
  verticalAlign?: "top" | "bottom";
  className?: string;
}

/** The key of the container's series, from its config; `content` swaps the body. */
export function ChartLegend({ content, verticalAlign = "bottom", className }: ChartLegendProps) {
  const api = useContext(ApiContext);
  const payload: ChartPayloadItem[] = Object.keys(api?.config ?? {}).map((key) => ({
    dataKey: key,
    value: key,
    color: chartColor(key),
  }));
  return isValidElement(content) ? (
    cloneElement(content as ReactElement<Record<string, unknown>>, {
      payload,
      verticalAlign,
      ...(className ? { className } : {}),
    })
  ) : (
    <ChartLegendContent payload={payload} verticalAlign={verticalAlign} className={className} />
  );
}
