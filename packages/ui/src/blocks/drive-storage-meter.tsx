// How much of a storage budget is used, in blocks: one run per part (my files, team drives, apps),
// the total written in mono, and a legend. Past the budget the whole bar turns to danger and says so.
//
// A root with parts. Without children it draws all four; with children, they place them:
// `StorageMeterHead` (label, `action`), `StorageMeterBar`, `StorageMeterTotal`, `StorageMeterLegend`.

import { createContext, useContext, type ComponentProps, type ReactNode } from "react";
import { cx } from "../cx";
import { BlockBar, formatBytes, type BlockTone } from "./drive-parts";

export interface StoragePart {
  label: string;
  /** In bytes. */
  bytes: number;
  /** `accent` by default for the first part, then `ink`, `muted`. */
  tone?: BlockTone;
}

export interface StorageMeterProps {
  /** What uses the space, in the order drawn. */
  parts: ReadonlyArray<StoragePart>;
  /** The budget, in bytes. */
  quota: number;
  /** Written above the bar. */
  label?: string;
  /** How many blocks; 40 by default. */
  cells?: number;
  /** Writes a size; `formatBytes` by default. */
  format?: (bytes: number) => string;
  /** The legend under the bar, one line per part; true by default. */
  legend?: boolean;
  /** At the end of the label row: a chip naming the store, a link to manage it. */
  action?: ReactNode;
  /** The regions of the meter; without them, the head, the bar, the total and the legend. */
  children?: ReactNode;
  className?: string;
}

const TONES: ReadonlyArray<BlockTone> = ["accent", "ink", "muted"];

interface MeterContext {
  parts: ReadonlyArray<StoragePart>;
  quota: number;
  used: number;
  over: boolean;
  label: string;
  cells: number;
  format: (bytes: number) => string;
  tones: ReadonlyArray<BlockTone>;
  runs: ReadonlyArray<{ ratio: number; tone: BlockTone }>;
  text: string;
}

const Ctx = createContext<MeterContext | null>(null);

/** The totals of the enclosing `StorageMeter`: used, over the budget, the runs. */
export function useStorageMeter(part = "useStorageMeter"): MeterContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error(`<${part}> goes inside a <StorageMeter>.`);
  return ctx;
}

/** The space used against a budget: blocks per part, the total, a legend. */
export function StorageMeter({
  parts,
  quota,
  label = "Storage",
  cells = 40,
  format = formatBytes,
  legend = true,
  action,
  children,
  className,
}: StorageMeterProps) {
  const used = parts.reduce((s, p) => s + Math.max(p.bytes, 0), 0);
  const over = quota > 0 && used > quota;
  const scale = over ? used : quota;
  const tones = parts.map((p, i) => p.tone ?? TONES[i % TONES.length]!);
  const runs = parts.map((p, i) => ({
    ratio: scale > 0 ? Math.max(p.bytes, 0) / scale : 0,
    tone: over ? ("danger" as const) : tones[i]!,
  }));
  const text = `${format(used)} of ${format(quota)}`;
  return (
    <Ctx.Provider value={{ parts, quota, used, over, label, cells, format, tones, runs, text }}>
      <div
        data-slot="storage-meter"
        className={cx("fg-storage", over && "fg-storage-over", className)}
      >
        {children ?? (
          <>
            <StorageMeterHead>{action}</StorageMeterHead>
            <StorageMeterBar />
            <StorageMeterTotal />
            {legend && parts.length > 1 ? <StorageMeterLegend /> : null}
          </>
        )}
      </div>
    </Ctx.Provider>
  );
}

/** The label row; its children (a chip naming the store, a link to manage it) come after it. */
export function StorageMeterHead({ className, children, ...rest }: ComponentProps<"div">) {
  const { label } = useStorageMeter("StorageMeterHead");
  return (
    <div data-slot="storage-meter-head" {...rest} className={cx("fg-storage-head", className)}>
      <span className="fg-storage-label">{label}</span>
      {children}
    </div>
  );
}

/** The blocks, as a meter for assistive technology. */
export function StorageMeterBar(props: ComponentProps<"div">) {
  const { label, quota, used, over, text, runs, cells } = useStorageMeter("StorageMeterBar");
  return (
    <div
      data-slot="storage-meter-bar"
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={quota}
      aria-valuenow={Math.min(used, quota)}
      aria-valuetext={over ? `${text}, over the budget` : text}
      {...props}
    >
      <BlockBar runs={runs} cells={cells} />
    </div>
  );
}

/** "12 GB of 50 GB", with a warning past the budget. */
export function StorageMeterTotal({ className, ...rest }: ComponentProps<"p">) {
  const { used, quota, over, format } = useStorageMeter("StorageMeterTotal");
  return (
    <p data-slot="storage-meter-total" {...rest} className={cx("fg-storage-total", className)}>
      <b>{format(used)}</b> of {format(quota)}
      {over ? <span className="fg-storage-warn"> · over the budget</span> : null}
    </p>
  );
}

/** One line for each part: its mark, its name, its size. */
export function StorageMeterLegend({ className, ...rest }: ComponentProps<"ul">) {
  const { parts, tones, format } = useStorageMeter("StorageMeterLegend");
  return (
    <ul data-slot="storage-meter-legend" {...rest} className={cx("fg-storage-legend", className)}>
      {parts.map((p, i) => (
        <li key={p.label}>
          <i className={`fg-blockbar-${tones[i]!}`} aria-hidden="true" />
          <span>{p.label}</span>
          <span className="fg-storage-size">{format(p.bytes)}</span>
        </li>
      ))}
    </ul>
  );
}
