import { Miniflare } from "miniflare";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// Spike FOR-14: can an action get all-or-nothing writes on D1, and through which API?
// Each test is one finding, measured on the local D1 of Miniflare (workerd); the answer is
// recorded in docs/DECISIONS.md (D-012). The local D1 runs the same engine as the remote one,
// but nothing here was run against a remote database.

const worker = `
export default {
  async fetch(request, env) {
    const { op, sql, statements } = await request.json();
    try {
      if (op === "exec") return Response.json({ ok: await env.DB.exec(sql) });
      if (op === "run") return Response.json({ ok: await env.DB.prepare(sql).run() });
      if (op === "first") return Response.json({ ok: await env.DB.prepare(sql).first() });
      if (op === "batch") {
        const results = await env.DB.batch(statements.map((s) => env.DB.prepare(s)));
        return Response.json({ ok: results.map((r) => r.results) });
      }
      return Response.json({ error: "unknown op" }, { status: 400 });
    } catch (error) {
      return Response.json({ error: String(error.message ?? error) });
    }
  },
};
`;

let mf: Miniflare;
const call = async (body: object) =>
  (await (
    await mf.dispatchFetch("http://d1.test/", { method: "POST", body: JSON.stringify(body) })
  ).json()) as {
    ok?: unknown;
    error?: string;
  };
const sql = (op: "exec" | "run", text: string) => call({ op, sql: text });
const batch = (...statements: string[]) => call({ op: "batch", statements });
const count = async (where: string) =>
  ((await call({ op: "first", sql: `SELECT count(*) AS n FROM ${where}` })).ok as { n: number }).n;

beforeAll(async () => {
  mf = new Miniflare({
    modules: true,
    script: worker,
    compatibilityDate: "2026-07-01",
    d1Databases: ["DB"],
  });
  await mf.ready;
  await sql("exec", "CREATE TABLE deals (id INTEGER PRIMARY KEY, stage TEXT NOT NULL)");
  await sql(
    "exec",
    "CREATE TABLE history (id INTEGER PRIMARY KEY, deal INTEGER NOT NULL REFERENCES deals(id))",
  );
});
afterAll(() => mf.dispose());

describe("D1: all-or-nothing writes", () => {
  it("a batch is atomic: a statement that fails undoes the ones before it", async () => {
    const result = await batch(
      "INSERT INTO deals (id, stage) VALUES (1, 'won')",
      "INSERT INTO deals (id, stage) VALUES (2, NULL)",
    );
    expect(result.error).toContain("NOT NULL constraint failed: deals.stage");
    expect(await count("deals WHERE id IN (1, 2)")).toBe(0);
  });

  it("and so across tables", async () => {
    const result = await batch(
      "INSERT INTO deals (id, stage) VALUES (10, 'won')",
      "INSERT INTO history (deal) VALUES (999)",
    );
    expect(result.error).toContain("FOREIGN KEY constraint failed");
    expect(await count("deals WHERE id = 10")).toBe(0);
  });

  it("a batch that succeeds keeps everything", async () => {
    expect(
      (
        await batch(
          "INSERT INTO deals (id, stage) VALUES (3, 'won')",
          "INSERT INTO deals (id, stage) VALUES (4, 'lost')",
        )
      ).error,
    ).toBeUndefined();
    expect(await count("deals WHERE id IN (3, 4)")).toBe(2);
  });

  it("a later statement of a batch sees what an earlier one wrote", async () => {
    const result = await batch(
      "INSERT INTO deals (id, stage) VALUES (20, 'won')",
      "INSERT INTO history (deal) SELECT id FROM deals WHERE id = 20",
      "SELECT count(*) AS n FROM history WHERE deal = 20",
    );
    expect(result.ok).toEqual([[], [], [{ n: 1 }]]);
  });
});

describe("D1: what is not atomic", () => {
  it("statements sent one by one are committed one by one", async () => {
    expect(
      (await sql("run", "INSERT INTO deals (id, stage) VALUES (30, 'open')")).error,
    ).toBeUndefined();
    expect((await sql("run", "INSERT INTO deals (id, stage) VALUES (31, NULL)")).error).toContain(
      "NOT NULL",
    );
    // The first write stayed: an action that fails midway leaves it behind.
    expect(await count("deals WHERE id = 30")).toBe(1);
  });

  it("there is no interactive transaction: BEGIN and SAVEPOINT are refused", async () => {
    expect((await sql("run", "BEGIN TRANSACTION")).error).toContain(
      "please use the state.storage.transaction()",
    );
    expect((await sql("run", "SAVEPOINT s")).error).toContain(
      "please use the state.storage.transaction()",
    );
    expect(
      (await sql("exec", "BEGIN; INSERT INTO deals (id, stage) VALUES (40, 'x'); COMMIT;")).error,
    ).toContain("please use the state.storage.transaction()");
    expect(await count("deals WHERE id = 40")).toBe(0);
  });

  it("a read before a batch is not isolated from what is written meanwhile", async () => {
    // The read and the batch are two requests to the database: nothing keeps the first valid.
    const read = (await call({ op: "first", sql: "SELECT stage FROM deals WHERE id = 3" })).ok as {
      stage: string;
    };
    await sql("run", "UPDATE deals SET stage = 'lost' WHERE id = 3"); // someone else
    // A guard in the statement itself is what makes the write safe: it changes nothing here.
    const guarded = (await call({
      op: "run",
      sql: `UPDATE deals SET stage = 'open' WHERE id = 3 AND stage = '${read.stage}'`,
    })) as { ok: { meta: { changes: number } } };
    expect(guarded.ok.meta.changes).toBe(0);
    expect(await count("deals WHERE id = 3 AND stage = 'lost'")).toBe(1);
  });
});
