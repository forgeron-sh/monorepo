// Small pixel marks drawn on the 12-pixel grid, for the properties of a record: the status of an
// issue, its priority, its size, a quarter. Taken from the Tasks prototype. "#" is the main tone,
// "o" the secondary one (35%).

import { cx } from "./cx";

type Cell = "#" | "o" | "";
type Rows = ReadonlyArray<string>;

function grid(fn: (x: number, y: number) => Cell): Rows {
  const rows: string[] = [];
  for (let y = 0; y < 12; y++) {
    let row = "";
    for (let x = 0; x < 12; x++) row += fn(x, y) || ".";
    rows.push(row);
  }
  return rows;
}

const edge = (x: number, y: number) =>
  ((x === 1 || x === 10) && y >= 1 && y <= 10) || ((y === 1 || y === 10) && x >= 1 && x <= 10);
const inner = (x: number, y: number) => x >= 3 && x <= 8 && y >= 3 && y <= 8;
const box = (x: number, y: number) => x >= 1 && x <= 10 && y >= 1 && y <= 10;

export type StatusKind = "backlog" | "todo" | "progress" | "review" | "done" | "canceled";

const STATUS: Record<StatusKind, Rows> = {
  backlog: grid((x, y) => (edge(x, y) && (x + y) % 2 === 0 ? "#" : "")),
  todo: grid((x, y) => (edge(x, y) ? "#" : "")),
  progress: grid((x, y) => (edge(x, y) || (inner(x, y) && x <= 5) ? "#" : inner(x, y) ? "o" : "")),
  review: grid((x, y) =>
    edge(x, y) || (inner(x, y) && !(x >= 6 && y <= 5)) ? "#" : inner(x, y) ? "o" : "",
  ),
  done: grid((x, y) => {
    if (!box(x, y)) return "";
    const tick = [
      [3, 6],
      [4, 7],
      [5, 8],
      [6, 7],
      [7, 6],
      [8, 5],
      [8, 4],
    ].some(([cx, cy]) => cx === x && cy === y);
    return tick ? "" : "#";
  }),
  canceled: grid((x, y) => (edge(x, y) || (inner(x, y) && (x === y || x === 11 - y)) ? "#" : "")),
};

/** 0 no priority, 1 urgent, 2 high, 3 medium, 4 low. */
export type PriorityLevel = 0 | 1 | 2 | 3 | 4;

const BARS: ReadonlyArray<[number, number, number]> = [
  [1, 2, 4],
  [5, 6, 7],
  [9, 10, 10],
];
const bars = (lit: number) =>
  grid((x, y) => {
    for (const [i, [a, b, h]] of BARS.entries())
      if (x >= a && x <= b && y > 10 - h && y <= 10) return i < lit ? "#" : "o";
    return "";
  });

const PRIORITY: Record<PriorityLevel, Rows> = {
  0: grid((x, y) =>
    y === 6 && ((x >= 1 && x <= 2) || (x >= 5 && x <= 6) || (x >= 9 && x <= 10)) ? "o" : "",
  ),
  1: grid((x, y) => {
    if (!box(x, y)) return "";
    return x >= 5 && x <= 6 && ((y >= 3 && y <= 6) || (y >= 8 && y <= 9)) ? "" : "#";
  }),
  2: bars(3),
  3: bars(2),
  4: bars(1),
};

/** 0 none, then XS to XL: a square that grows from the bottom left. */
export type SizeLevel = 0 | 1 | 2 | 3 | 4 | 5;

const SIZE: Record<SizeLevel, Rows> = {
  0: grid((x, y) => (edge(x, y) && (x + y) % 2 === 0 ? "o" : "")),
  1: grid((x, y) => (x >= 1 && x <= 2 && y >= 9 && y <= 10 ? "#" : edge(x, y) ? "o" : "")),
  2: grid((x, y) => (x >= 1 && x <= 4 && y >= 7 && y <= 10 ? "#" : edge(x, y) ? "o" : "")),
  3: grid((x, y) => (x >= 1 && x <= 6 && y >= 5 && y <= 10 ? "#" : edge(x, y) ? "o" : "")),
  4: grid((x, y) => (x >= 1 && x <= 8 && y >= 3 && y <= 10 ? "#" : edge(x, y) ? "o" : "")),
  5: grid((x, y) => (box(x, y) ? "#" : "")),
};

/** A quarter: four cells, the one of the quarter filled. */
const quarter = (q: 1 | 2 | 3 | 4) =>
  grid((x, y) => {
    if (!box(x, y)) return "";
    const col = x <= 5 ? 0 : 1;
    const row = y <= 5 ? 0 : 1;
    if (x === 5 || x === 6 || y === 5 || y === 6) return "";
    return row * 2 + col + 1 === q ? "#" : "o";
  });

function path(rows: Rows, mark: "#" | "o"): string {
  let d = "";
  rows.forEach((row, y) => {
    for (let x = 0; x < 12; x++) if (row[x] === mark) d += `M${x} ${y}h1v1h-1z`;
  });
  return d;
}

function Glyph({ rows, className, size = 12 }: { rows: Rows; className?: string; size?: number }) {
  const secondary = path(rows, "o");
  return (
    <svg
      className={cx("fg-glyph", className)}
      viewBox="0 0 12 12"
      width={size}
      height={size}
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      <path fill="currentColor" d={path(rows, "#")} />
      {secondary ? <path fill="currentColor" opacity={0.35} d={secondary} /> : null}
    </svg>
  );
}

export interface GlyphProps {
  size?: number;
  className?: string;
}

/** The status of an issue, in its colour: in progress amber, in review green, done in ember. */
export function StatusGlyph({ status, ...rest }: GlyphProps & { status: StatusKind }) {
  return (
    <Glyph rows={STATUS[status]} {...rest} className={cx(`fg-st-${status}`, rest.className)} />
  );
}

/** Priority bars; urgent is a filled square with an exclamation mark, in ember. */
export function PriorityGlyph({ level, ...rest }: GlyphProps & { level: PriorityLevel }) {
  return (
    <Glyph
      rows={PRIORITY[level]}
      {...rest}
      className={cx(level === 1 ? "fg-pr-urgent" : "fg-pr", rest.className)}
    />
  );
}

export function SizeGlyph({ level, ...rest }: GlyphProps & { level: SizeLevel }) {
  return <Glyph rows={SIZE[level]} {...rest} className={cx("fg-pr", rest.className)} />;
}

export function QuarterGlyph({ quarter: q, ...rest }: GlyphProps & { quarter: 1 | 2 | 3 | 4 }) {
  return <Glyph rows={quarter(q)} {...rest} className={cx("fg-pr", rest.className)} />;
}
