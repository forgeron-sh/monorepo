// What the platform's D1 costs a call, for the `Server-Timing` header (D-143). The time a read waits for D1 is
// mostly the road to the database, not the SQL: D1 reports the SQL's own duration and the region that served
// the read, so the two are told apart. One scope per call (`AsyncLocalStorage`), the probe adds to it.

import { AsyncLocalStorage } from "node:async_hooks";
import type { D1Database } from "@forgeron/hosting";

export interface D1Stats {
  /** Statements run, in a batch or alone. */
  queries: number;
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
  const stats: D1Stats = { queries: 0, waitMs: 0, sqlMs: 0, served: new Set() };
  return scope.run(stats, () => run(stats));
}

/** `d1;dur=…`, `d1.sql;dur=…` and where it was served, as `Server-Timing` entries. */
export function d1Entries(stats: D1Stats): string[] {
  if (stats.queries === 0) return [];
  const served = [...stats.served].join(" and ");
  return [
    `d1;dur=${stats.waitMs.toFixed(1)};desc="${stats.queries} queries, added up"`,
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
  stats.queries += 1;
  stats.waitMs += clock() - started;
  const metas = (Array.isArray(result) ? result : [result]).map(
    (r) => (r as { meta?: Meta } | null)?.meta,
  );
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

function statement(inner: Statement): Statement {
  const wrapped: Record<string | symbol, unknown> = {
    [INNER]: inner,
    bind: (...values: unknown[]) => statement(inner.bind(...values)),
  };
  for (const name of RUNS) {
    const run = (inner as unknown as Record<string, unknown>)[name];
    if (typeof run !== "function") continue;
    wrapped[name] = async (...args: unknown[]) => {
      const started = clock();
      const result: unknown = await run.apply(inner, args);
      note(scope.getStore(), started, result);
      return result;
    };
  }
  return wrapped as unknown as Statement;
}

/** The same database, counting what it is asked inside a `withD1Stats` scope; outside one it adds nothing. */
export function probeD1(d1: D1Database): D1Database {
  return new Proxy(d1, {
    get(target, name) {
      if (name === "prepare") return (sql: string) => statement(target.prepare(sql));
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
