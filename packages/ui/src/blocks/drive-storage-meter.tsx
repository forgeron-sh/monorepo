// How much of a storage budget is used, in blocks: one run per part (my files, team drives, apps),
// the total written in mono, and a legend. Past the budget the whole bar turns to danger and says so.

import type { ReactNode } from "react";
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
  className?: string;
}

const TONES: ReadonlyArray<BlockTone> = ["accent", "ink", "muted"];

/** The space used against a budget: blocks per part, the total, a legend. */
export function StorageMeter({
  parts,
  quota,
  label = "Storage",
  cells = 40,
  format = formatBytes,
  legend = true,
  action,
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
    <div className={cx("fg-storage", over && "fg-storage-over", className)}>
      <div className="fg-storage-head">
        <span className="fg-storage-label">{label}</span>
        {action}
      </div>
      <div
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={quota}
        aria-valuenow={Math.min(used, quota)}
        aria-valuetext={over ? `${text}, over the budget` : text}
      >
        <BlockBar runs={runs} cells={cells} />
      </div>
      <p className="fg-storage-total">
        <b>{format(used)}</b> of {format(quota)}
        {over ? <span className="fg-storage-warn"> · over the budget</span> : null}
      </p>
      {legend && parts.length > 1 ? (
        <ul className="fg-storage-legend">
          {parts.map((p, i) => (
            <li key={p.label}>
              <i className={`fg-blockbar-${tones[i]!}`} aria-hidden="true" />
              <span>{p.label}</span>
              <span className="fg-storage-size">{format(p.bytes)}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
