// What the platform's D1 costs a call, for the `Server-Timing` header (D-143). The time a read waits for D1 is
// mostly the road to the database, not the SQL: D1 reports the SQL's own duration and the region that served
// the read, so the two are told apart. One scope per call (`AsyncLocalStorage`), the probe adds to it.
//
// With `together`, the reads a call starts in the same turn go to D1 in one `batch` (D-146): one trip
// instead of one each. D1 runs a batch's statements one after the other, in one call to the database.

import { AsyncLocalStorage } from "node:async_hooks";
import type { D1Database } from "@forgeron/hosting";

export interface D1Stats {
  /** Statements run, in a batch or alone. */
  queries: number;
  /** Calls to D1: a batch is one, whatever it holds. */
  trips: number;
  /** Time spent waiting for D1, added up: reads that run together add up to more than the call lasted. */
  waitMs: number;
  /** The SQL's own duration, as D1 reports it. */
  sqlMs: number;
  /** `served_by_region` of what D1 said, with whether the primary served it: `WEUR primary`. */
  served: Set<string>;
}

const scope = new AsyncLocalStorage<D1Stats>();

/** Runs `run` with its own counters, and hands them to it. */
export function withD1Stats<T>(run: (stats: D1Stats) => Promise<T>): Promise<T> {
  const stats: D1Stats = { queries: 0, trips: 0, waitMs: 0, sqlMs: 0, served: new Set() };
  return scope.run(stats, () => run(stats));
}

/**
 * Runs `run` outside the call's counters: what is done after the answer (the seat, the usage) is not what the
 * call waited for, so it is not told in its `Server-Timing` (D-146).
 */
export function apartFromD1Stats<T>(run: () => T): T {
  return scope.run(undefined as unknown as D1Stats, run);
}

/** `d1;dur=…`, `d1.sql;dur=…` and where it was served, as `Server-Timing` entries. */
export function d1Entries(stats: D1Stats): string[] {
  if (stats.queries === 0) return [];
  const served = [...stats.served].join(" and ");
  return [
    `d1;dur=${stats.waitMs.toFixed(1)};desc="${stats.trips} trips, ${stats.queries} statements, added up"`,
    `d1.sql;dur=${stats.sqlMs.toFixed(1)}`,
    ...(served ? [`d1.where;dur=0;desc="${served}"`] : []),
  ];
}

interface Meta {
  duration?: number;
  served_by_region?: string;
  served_by_primary?: boolean;
}

type Statement = ReturnType<D1Database["prepare"]>;

const INNER = Symbol("statement");
const clock = () => performance.now();

function note(stats: D1Stats | undefined, started: number, result: unknown) {
  if (!stats) return;
  const results = Array.isArray(result) ? result : [result];
  stats.queries += results.length;
  stats.trips += 1;
  stats.waitMs += clock() - started;
  const metas = results.map((r) => (r as { meta?: Meta } | null)?.meta);
  for (const meta of metas) {
    if (typeof meta?.duration === "number") stats.sqlMs += meta.duration;
    if (meta?.served_by_region) {
      stats.served.add(
        `${meta.served_by_region}${meta.served_by_primary ? " primary" : " replica"}`,
      );
    }
  }
}

// What the database gives a statement to run: `all`, and on the real binding `first`, `run` and `raw`.
const RUNS = ["first", "all", "run", "raw"] as const;

/**
 * A read: what can wait for the others of its turn without changing what anything else sees. A `WITH` is not
 * one: it can lead to an `INSERT` (the platform's own migrations do).
 */
const READ = /^\s*SELECT\b/i;

interface Waiting {
  statement: Statement;
  resolve(result: unknown): void;
  reject(error: unknown): void;
}

/** What gathers the reads of a turn: one list per call (its scope), sent when the turn ends. */
function gatherer(target: D1Database) {
  const waiting = new Map<D1Stats | undefined, Waiting[]>();
  const alone = async (stats: D1Stats | undefined, one: Waiting) => {
    const started = clock();
    try {
      const result = await one.statement.all();
      note(stats, started, result);
      one.resolve(result);
    } catch (error) {
      one.reject(error);
    }
  };
  const send = async (stats: D1Stats | undefined) => {
    const list = waiting.get(stats) ?? [];
    waiting.delete(stats);
    if (list.length === 1) return alone(stats, list[0]!);
    const started = clock();
    let results: unknown[];
    try {
      results = await target.batch(list.map((w) => w.statement));
    } catch {
      // A batch fails whole: each read is asked again alone, so a failing one fails only its own caller.
      await Promise.all(list.map((w) => alone(stats, w)));
      return;
    }
    note(stats, started, results);
    list.forEach((w, i) => w.resolve(results[i]));
  };
  return (statement: Statement): Promise<unknown> => {
    const stats = scope.getStore();
    return new Promise((resolve, reject) => {
      const list = waiting.get(stats);
      if (list) {
        list.push({ statement, resolve, reject });
        return;
      }
      waiting.set(stats, [{ statement, resolve, reject }]);
      // The end of the turn: every read started by then, in this call, goes in the same batch.
      setTimeout(() => void scope.run(stats as D1Stats, () => send(stats)), 0);
    });
  };
}

function statement(
  inner: Statement,
  sql: string,
  gather?: (statement: Statement) => Promise<unknown>,
): Statement {
  const wrapped: Record<string | symbol, unknown> = {
    [INNER]: inner,
    bind: (...values: unknown[]) => statement(inner.bind(...values), sql, gather),
  };
  for (const name of RUNS) {
    const run = (inner as unknown as Record<string, unknown>)[name];
    if (typeof run !== "function") continue;
    wrapped[name] =
      gather && name === "all" && READ.test(sql)
        ? () => gather(inner)
        : async (...args: unknown[]) => {
            const started = clock();
            const result: unknown = await run.apply(inner, args);
            note(scope.getStore(), started, result);
            return result;
          };
  }
  return wrapped as unknown as Statement;
}

/**
 * The same database, counting what it is asked inside a `withD1Stats` scope; outside one it adds nothing.
 * With `together`, the reads (`SELECT` through `all`) of a turn are sent in one batch (D-146).
 */
export function probeD1(d1: D1Database, options: { together?: boolean } = {}): D1Database {
  const gather = options.together ? gatherer(d1) : undefined;
  return new Proxy(d1, {
    get(target, name) {
      if (name === "prepare") return (sql: string) => statement(target.prepare(sql), sql, gather);
      if (name === "batch") {
        return async (statements: Statement[]) => {
          const started = clock();
          const result = await target.batch(
            statements.map((s) => (s as unknown as { [INNER]?: Statement })[INNER] ?? s),
          );
          note(scope.getStore(), started, result);
          return result;
        };
      }
      const value = Reflect.get(target, name, target) as unknown;
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
}
