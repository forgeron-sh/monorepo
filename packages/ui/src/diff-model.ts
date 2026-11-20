// The pure part of Diff (D-157): a line diff (Myers, no dependency), words inside a changed line,
// split rows, stats, and the changes between the fields of two records. No React, no DOM. The
// "structure" blocks re-export these names.

export interface StructureDiffOp {
  kind: "equal" | "delete" | "insert";
  /** The range of `a` this covers (empty for an insert). */
  aStart: number;
  aEnd: number;
  /** The range of `b` this covers (empty for a delete). */
  bStart: number;
  bEnd: number;
}

/**
 * The shortest edit script between two sequences (Myers, O(ND)): runs that are equal, deleted from
 * `a` or inserted from `b`, in order, covering both inputs completely.
 */
export function structureDiffSeq<T>(
  a: ReadonlyArray<T>,
  b: ReadonlyArray<T>,
  same: (x: T, y: T) => boolean = Object.is,
): StructureDiffOp[] {
  let head = 0;
  while (head < a.length && head < b.length && same(a[head]!, b[head]!)) head++;
  let tail = 0;
  while (
    tail < a.length - head &&
    tail < b.length - head &&
    same(a[a.length - 1 - tail]!, b[b.length - 1 - tail]!)
  )
    tail++;
  const n = a.length - head - tail;
  const m = b.length - head - tail;

  // One step per element: true when the element is equal in both, else delete / insert.
  const steps: Array<"equal" | "delete" | "insert"> = [];
  for (let i = 0; i < head; i++) steps.push("equal");
  if (n === 0) for (let i = 0; i < m; i++) steps.push("insert");
  else if (m === 0) for (let i = 0; i < n; i++) steps.push("delete");
  else {
    const max = n + m;
    const off = max + 1;
    const v = new Int32Array(2 * max + 3);
    const trace: Int32Array[] = [];
    let found = false;
    for (let d = 0; d <= max && !found; d++) {
      // The window k in [-d-1, d+1] of the values before this round.
      trace.push(v.slice(off - d - 1, off + d + 2));
      for (let k = -d; k <= d; k += 2) {
        let x: number;
        if (k === -d || (k !== d && v[off + k - 1]! < v[off + k + 1]!)) x = v[off + k + 1]!;
        else x = v[off + k - 1]! + 1;
        let y = x - k;
        while (x < n && y < m && same(a[head + x]!, b[head + y]!)) {
          x++;
          y++;
        }
        v[off + k] = x;
        if (x >= n && y >= m) {
          found = true;
          break;
        }
      }
    }
    const back: Array<"equal" | "delete" | "insert"> = [];
    let x = n;
    let y = m;
    for (let d = trace.length - 1; d >= 0; d--) {
      const w = trace[d]!;
      const at = (k: number) => w[k + d + 1]!;
      const k = x - y;
      const prevK = k === -d || (k !== d && at(k - 1) < at(k + 1)) ? k + 1 : k - 1;
      const prevX = at(prevK);
      const prevY = prevX - prevK;
      while (x > prevX && y > prevY) {
        back.push("equal");
        x--;
        y--;
      }
      if (d > 0) {
        back.push(x === prevX ? "insert" : "delete");
      }
      x = prevX;
      y = prevY;
    }
    back.reverse();
    steps.push(...back);
  }
  for (let i = 0; i < tail; i++) steps.push("equal");

  const ops: StructureDiffOp[] = [];
  let ai = 0;
  let bi = 0;
  for (const kind of steps) {
    const last = ops[ops.length - 1];
    if (last && last.kind === kind) {
      if (kind !== "insert") last.aEnd++;
      if (kind !== "delete") last.bEnd++;
    } else {
      ops.push({
        kind,
        aStart: ai,
        aEnd: ai + (kind === "insert" ? 0 : 1),
        bStart: bi,
        bEnd: bi + (kind === "delete" ? 0 : 1),
      });
    }
    if (kind !== "insert") ai++;
    if (kind !== "delete") bi++;
  }
  return ops;
}

/** Words, runs of spaces and single marks: what the word-level highlight compares. */
export function structureTokens(text: string): string[] {
  return text.match(/\s+|[\p{L}\p{N}_]+|[^\s\p{L}\p{N}_]/gu) ?? [];
}

export interface StructureDiffPiece {
  text: string;
  /** Present on this side only. */
  changed: boolean;
}

/** The two sides of one line, cut into what is kept and what changed. Null when little is shared. */
export function structureDiffWords(
  before: string,
  after: string,
): { before: StructureDiffPiece[]; after: StructureDiffPiece[] } | null {
  const a = structureTokens(before);
  const b = structureTokens(after);
  const ops = structureDiffSeq(a, b);
  const kept = ops
    .filter((o) => o.kind === "equal")
    .reduce((n, o) => n + a.slice(o.aStart, o.aEnd).join("").length, 0);
  const longest = Math.max(before.length, after.length);
  if (longest === 0 || kept / longest < 0.3) return null;
  const left: StructureDiffPiece[] = [];
  const right: StructureDiffPiece[] = [];
  const push = (list: StructureDiffPiece[], text: string, changed: boolean) => {
    if (!text) return;
    const last = list[list.length - 1];
    if (last && last.changed === changed) last.text += text;
    else list.push({ text, changed });
  };
  for (const o of ops) {
    if (o.kind !== "insert") push(left, a.slice(o.aStart, o.aEnd).join(""), o.kind === "delete");
    if (o.kind !== "delete") push(right, b.slice(o.bStart, o.bEnd).join(""), o.kind === "insert");
  }
  return { before: left, after: right };
}

export type StructureDiffRow =
  | { kind: "same"; aNo: number; bNo: number; text: string }
  | { kind: "del"; aNo: number; text: string; pieces?: StructureDiffPiece[] }
  | { kind: "add"; bNo: number; text: string; pieces?: StructureDiffPiece[] }
  /** `count` unchanged lines left out, starting at line `aNo` of the old text. */
  | { kind: "fold"; id: string; count: number; aNo: number; bNo: number };

export interface StructureDiffOptions {
  /** Unchanged lines kept around a change. Default 3. */
  context?: number;
  /** `false` keeps every unchanged line. */
  collapse?: boolean;
  /** Folds already opened. */
  expanded?: ReadonlySet<string>;
}

const splitLines = (text: string) => (text === "" ? [] : text.split(/\r?\n/));

/** The lines of two texts as rows: unchanged, removed, added, with long unchanged runs folded. */
export function structureDiffRows(
  before: string,
  after: string,
  options: StructureDiffOptions = {},
): StructureDiffRow[] {
  const { context = 3, collapse = true, expanded } = options;
  const a = splitLines(before);
  const b = splitLines(after);
  const ops = structureDiffSeq(a, b);
  const rows: StructureDiffRow[] = [];
  for (let i = 0; i < ops.length; i++) {
    const op = ops[i]!;
    if (op.kind === "equal") {
      for (let k = 0; k < op.aEnd - op.aStart; k++)
        rows.push({
          kind: "same",
          aNo: op.aStart + k + 1,
          bNo: op.bStart + k + 1,
          text: a[op.aStart + k]!,
        });
      continue;
    }
    // A removal followed by an addition is one change: pair the lines to highlight the words.
    const next = ops[i + 1];
    const del = op.kind === "delete" ? op : null;
    const add = op.kind === "insert" ? op : next?.kind === "insert" ? next : null;
    const delLines = del ? a.slice(del.aStart, del.aEnd) : [];
    const addLines = add ? b.slice(add.bStart, add.bEnd) : [];
    const pieces = delLines.map((line, k) =>
      addLines[k] !== undefined ? structureDiffWords(line, addLines[k]!) : null,
    );
    delLines.forEach((text, k) => {
      const p = pieces[k]?.before;
      rows.push({ kind: "del", aNo: del!.aStart + k + 1, text, ...(p ? { pieces: p } : {}) });
    });
    addLines.forEach((text, k) => {
      const p = pieces[k]?.after;
      rows.push({ kind: "add", bNo: add!.bStart + k + 1, text, ...(p ? { pieces: p } : {}) });
    });
    if (del && add && add === next) i++;
  }
  if (!collapse) return rows;
  const out: StructureDiffRow[] = [];
  let i = 0;
  while (i < rows.length) {
    if (rows[i]!.kind !== "same") {
      out.push(rows[i++]!);
      continue;
    }
    let j = i;
    while (j < rows.length && rows[j]!.kind === "same") j++;
    const run = rows.slice(i, j) as Array<Extract<StructureDiffRow, { kind: "same" }>>;
    const keepHead = i === 0 ? 0 : context;
    const keepTail = j === rows.length ? 0 : context;
    const hidden = run.length - keepHead - keepTail;
    const id = `fold-${run[0]!.aNo}`;
    if (hidden < 2 || expanded?.has(id)) out.push(...run);
    else {
      out.push(...run.slice(0, keepHead));
      const first = run[keepHead]!;
      out.push({ kind: "fold", id, count: hidden, aNo: first.aNo, bNo: first.bNo });
      out.push(...run.slice(run.length - keepTail));
    }
    i = j;
  }
  return out;
}

export interface StructureSplitRow {
  left: { no: number; text: string; kind: "same" | "del"; pieces?: StructureDiffPiece[] } | null;
  right: { no: number; text: string; kind: "same" | "add"; pieces?: StructureDiffPiece[] } | null;
  fold?: Extract<StructureDiffRow, { kind: "fold" }>;
}

/** The same rows for two columns: a removed line faces the line added in its place. */
export function structureSplitRows(rows: ReadonlyArray<StructureDiffRow>): StructureSplitRow[] {
  const out: StructureSplitRow[] = [];
  let i = 0;
  while (i < rows.length) {
    const row = rows[i]!;
    if (row.kind === "same") {
      out.push({
        left: { no: row.aNo, text: row.text, kind: "same" },
        right: { no: row.bNo, text: row.text, kind: "same" },
      });
      i++;
    } else if (row.kind === "fold") {
      out.push({ left: null, right: null, fold: row });
      i++;
    } else {
      const dels: Array<Extract<StructureDiffRow, { kind: "del" }>> = [];
      const adds: Array<Extract<StructureDiffRow, { kind: "add" }>> = [];
      while (i < rows.length && rows[i]!.kind === "del") dels.push(rows[i++] as never);
      while (i < rows.length && rows[i]!.kind === "add") adds.push(rows[i++] as never);
      for (let k = 0; k < Math.max(dels.length, adds.length); k++) {
        const d = dels[k];
        const a = adds[k];
        out.push({
          left: d
            ? { no: d.aNo, text: d.text, kind: "del", ...(d.pieces ? { pieces: d.pieces } : {}) }
            : null,
          right: a
            ? { no: a.bNo, text: a.text, kind: "add", ...(a.pieces ? { pieces: a.pieces } : {}) }
            : null,
        });
      }
    }
  }
  return out;
}

/** Lines added and removed. */
export function structureDiffStats(rows: ReadonlyArray<StructureDiffRow>): {
  added: number;
  removed: number;
} {
  return {
    added: rows.filter((r) => r.kind === "add").length,
    removed: rows.filter((r) => r.kind === "del").length,
  };
}

export type StructureFieldStatus = "added" | "removed" | "changed" | "same";

export interface StructureFieldChange {
  /** The path of the field, `address.city` for a nested one. */
  key: string;
  status: StructureFieldStatus;
  before?: string;
  after?: string;
  /** Words kept and changed, when both sides are text that shares enough. */
  pieces?: { before: StructureDiffPiece[]; after: StructureDiffPiece[] };
}

/** A value as the text shown: lists joined, objects as JSON, null as an empty field. */
export function structureFormatValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value))
    return value.every((v) => v === null || typeof v !== "object")
      ? value.map(structureFormatValue).join(", ")
      : JSON.stringify(value);
  return JSON.stringify(value);
}

const isPlain = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v) && !(v instanceof Date);

const flattenFields = (
  value: Record<string, unknown>,
  prefix = "",
  out: Map<string, unknown> = new Map(),
) => {
  for (const [k, v] of Object.entries(value)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (isPlain(v) && Object.keys(v).length > 0) flattenFields(v, key, out);
    else out.set(key, v);
  }
  return out;
};

/** The fields of two records side by side: added, removed, changed, or the same. */
export function structureDiffFields(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): StructureFieldChange[] {
  const a = flattenFields(before);
  const b = flattenFields(after);
  const keys = [...b.keys(), ...[...a.keys()].filter((k) => !b.has(k))];
  return keys.map((key) => {
    const inA = a.has(key);
    const inB = b.has(key);
    const from = structureFormatValue(a.get(key));
    const to = structureFormatValue(b.get(key));
    if (!inA) return { key, status: "added", after: to };
    if (!inB) return { key, status: "removed", before: from };
    if (from === to) return { key, status: "same", before: from, after: to };
    const pieces = from && to ? structureDiffWords(from, to) : null;
    return { key, status: "changed", before: from, after: to, ...(pieces ? { pieces } : {}) };
  });
}
