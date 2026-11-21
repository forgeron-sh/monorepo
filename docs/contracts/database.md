# Contract: `database`

> Status: proposal (21 November 2026). Version `database@1`. Prefix `DB`. Mirrors Cloudflare D1. See [README](README.md) for the id scheme and the rule of the weakest guarantee.

## 1. Purpose

The tool's relational data: one SQLite database per tool and channel. A tool keeps its records there, reads them with SQL and makes several writes atomic in one batch (D-012). It is the only wave-1 contract that is fully wired today: `ctx.db` is Kysely over a D1 binding, plus `batch`.

## 2. Declaration

Today (`packages/sdk/src/config.ts`, `packages/manifest/src/schema.ts`):

```ts
resources: {
  db: database({ engine: "d1", why: "Companies, contacts and leads" }),
}
```

The schema accepts only `engine: z.literal("d1")`, and `database()` forces it whatever is passed. Both templates write it (`templates/crm`, `templates/inventory`).

Proposed (reframing §4.1, manifest contract bump to 4):

```ts
resources: {
  db: database({ why: "Companies, contacts and leads" }),
}
```

The manifest stores `db: { why? }`. A manifest of contract 3 with `engine: "d1"` is read as `database@1`; the build of contract 4 drops the key. The schema (`db/schema.ts`), migrations and seed are unchanged.

## 3. Interface

What a provider implements (`@forgeron/contracts`). It is the part of the D1 binding the runtime already uses (`D1Like` in `packages/runtime/src/db.ts`: `prepare`, `bind`, `all`, `batch`), typed more strictly.

```ts
/** What a statement binds and a row holds (DB-08). */
export type SqlValue = null | number | string | Uint8Array;

export interface Database {
  /** Prepares one SQL statement with `?` placeholders. Does not run it. */
  prepare(sql: string): Statement;
  /**
   * Runs the statements in order, as one transaction: all of them commit, or none (DB-03).
   * Resolves with one result per statement, in the same order.
   */
  batch(statements: readonly Statement[]): Promise<StatementResult[]>;
}

export interface Statement {
  /** Binds the values, in order, to the `?` placeholders. Returns a new statement. */
  bind(...values: SqlValue[]): Statement;
  /** Runs the statement alone, in auto-commit (DB-02), and returns every row. */
  all<Row = Record<string, SqlValue>>(): Promise<StatementResult<Row>>;
}

export interface StatementResult<Row = Record<string, SqlValue>> {
  results: Row[];
  meta: {
    /** Rows written by this statement (INSERT, UPDATE, DELETE). */
    changes: number;
    /** The rowid of the last inserted row; see DB-N5. */
    last_row_id: number;
  };
}
```

What a tool sees on top, unchanged: `ctx.db` is `Kysely<DB>` plus `batch(statements: Compilable[]): Promise<{ rows; changes }[]>` (`createDb`). Differences from today:

- `createDb` turns `undefined` into `NULL` and `boolean` into `0/1` before binding. D1 refuses `undefined` with `D1_TYPE_ERROR` ([Worker Binding API](https://developers.cloudflare.com/d1/worker-api/)); the contract keeps the refusal at the provider and leaves the coercion in the SDK.
- D1's `first()`, `run()`, `raw()`, `exec()`, `dump()` and `withSession()` are not in the contract. `exec()` stays a host operation (migrations, seeds). `withSession()` is open question 2.
- Kysely's `transaction()` throws today (`NO_TRANSACTION` in `db.ts`); the contract makes it an error code, `DB_TRANSACTION_UNSUPPORTED`.

## 4. Guarantees

| Id    | Guarantee                                                                                                                                                                                                 | Cloudflare source                                                                                                                                                                                                                             | Anvil                                                                                                                             |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| DB-01 | **SQLite dialect.** A statement SQLite accepts, and that uses only core SQL and the JSON functions, runs with SQLite's semantics (type affinity, `CHECK`, `json_valid`).                                  | D1 is SQLite; the version and the enabled extensions are not stated on the pages fetched: **UNVERIFIED**                                                                                                                                      | rusqlite with a bundled SQLite, version pinned per release; JSON functions compiled in                                            |
| DB-02 | **One statement is atomic.** A statement run alone either applies entirely or not at all.                                                                                                                 | "D1 operates in auto-commit" ([D1 Database](https://developers.cloudflare.com/d1/worker-api/d1-database/))                                                                                                                                    | auto-commit on a single connection                                                                                                |
| DB-03 | **A batch is atomic.** Every statement of a `batch` commits, or none does; on failure the error names the failing statement and nothing of the batch remains.                                             | "Batched statements are SQL transactions … the sequence is aborted or rolled back" ([D1 Database](https://developers.cloudflare.com/d1/worker-api/d1-database/)); measured on local D1 in `packages/hosting/src/d1-atomicity.test.ts` (D-012) | `BEGIN IMMEDIATE … COMMIT` around the batch, `ROLLBACK` on the first error                                                        |
| DB-04 | **A batch runs in order and sees itself.** Statement _n_ sees what statements _1…n-1_ wrote (`INSERT … SELECT`, `UPDATE … WHERE` on a row just inserted).                                                 | "each statement in the list will execute and commit, sequentially, non-concurrently" ([D1 Database](https://developers.cloudflare.com/d1/worker-api/d1-database/))                                                                            | one transaction, statements in order                                                                                              |
| DB-05 | **A batch is isolated.** No other call's write lands between two statements of a batch.                                                                                                                   | Implied by "non-concurrently" and a single primary; not stated as isolation: **UNVERIFIED** (to prove on a remote D1, as D-012 already asks)                                                                                                  | one writer connection per database file; `BEGIN IMMEDIATE`                                                                        |
| DB-06 | **Read your writes within a call.** A read issued after a write (or batch) resolved, in the same call, sees it.                                                                                           | Without the Sessions API "all queries will continue to be executed only by the primary database" ([read replication](https://developers.cloudflare.com/d1/best-practices/read-replication/))                                                  | one database file, WAL                                                                                                            |
| DB-07 | **Read writes of earlier calls.** A call that starts after another call's write resolved sees that write.                                                                                                 | Same: primary only while no session is used ([read replication](https://developers.cloudflare.com/d1/best-practices/read-replication/)). Holds only while the provider does not use replicas; see open question 2                             | one database file                                                                                                                 |
| DB-08 | **Values.** `null`, `number`, `string` and bytes bind and read back as the same JS type; an `INTEGER` column reads back as `number`; a byte array round-trips byte-identical.                             | Type table of the [Worker Binding API](https://developers.cloudflare.com/d1/worker-api/) (BLOB reads back as an `Array` there: the provider converts to `Uint8Array`)                                                                         | rusqlite value mapping                                                                                                            |
| DB-09 | **Constraints are enforced**: `NOT NULL`, `UNIQUE`, `CHECK`, and foreign keys with their `ON DELETE` actions.                                                                                             | Foreign keys failed a batch on local D1 (D-012 measurement); the D1 documentation page on foreign keys was not fetched: **UNVERIFIED**                                                                                                        | `PRAGMA foreign_keys = ON` on every connection                                                                                    |
| DB-10 | **Durability.** A write whose promise resolved survives a provider restart.                                                                                                                               | Not stated on the pages fetched (D1 Time Travel not checked): **UNVERIFIED**                                                                                                                                                                  | WAL, `synchronous = FULL` in `serve`; backups by WAL shipping (reframing §4.3)                                                    |
| DB-11 | **No interactive transaction.** `BEGIN`, `COMMIT`, `ROLLBACK`, `SAVEPOINT` and `RELEASE` are refused with `DB_TRANSACTION_UNSUPPORTED`, alone or inside a batch.                                          | Refused on local D1 with "please use the state.storage.transaction()" (D-012)                                                                                                                                                                 | the provider parses the leading keyword and refuses, although SQLite could run it                                                 |
| DB-12 | **Isolation between tools.** A tool's statements reach only its own database. `ATTACH`, `DETACH` and `PRAGMA` writes are refused.                                                                         | One D1 per Worker, bound as `DB` (`packages/hosting/src/resources.ts`: `<worker>--db`)                                                                                                                                                        | one file per tool and channel; the host socket only opens the caller's own; `sqlite3_set_authorizer` refuses `ATTACH` and pragmas |
| DB-13 | **Isolation between channels.** Each channel has its own database. A branch's database starts from the seed or empty (`preview.data`), never from production; only an admin copies data between branches. | One D1 per channel's Worker ([`lifecycle.md`](../lifecycle.md), "Branches")                                                                                                                                                                   | one file per channel                                                                                                              |
| DB-14 | **Migrations are atomic with their record.** A migration and its `_forgeron_migrations` row apply in one batch, before traffic reaches the version (D-012, D-014).                                        | Host-side, `packages/hosting/src/migrate.ts`                                                                                                                                                                                                  | same code path, through the host                                                                                                  |

## 5. Non-guarantees

| Id    | A tool must not rely on                                                                                                                                                                                     | Anvil dev chaos                                                                                                                                  |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| DB-N1 | **A read before a batch being current at the batch.** Read, decide in code, then write: another call may have written in between (D-012). Guard the write in SQL (`WHERE version = ?`) and check `changes`. | delay every batch that follows a read in the same call by a random 0–200 ms, and run a concurrent writer test fixture in `forgeron test --chaos` |
| DB-N2 | **Two batches of one call being atomic together.** Only one batch is atomic. An action that writes in two batches can leave the first one behind.                                                           | fail the second batch of a call at random (1 %) with `DB_UNAVAILABLE`                                                                            |
| DB-N3 | **Row order without `ORDER BY`.**                                                                                                                                                                           | `PRAGMA reverse_unordered_selects = ON`                                                                                                          |
| DB-N4 | **Integers beyond 2^53.** They lose precision as `number`; `bigint` is not supported ([Worker Binding API](https://developers.cloudflare.com/d1/worker-api/), "BigInts are not currently supported").       | none; DB-L05 refuses `bigint`                                                                                                                    |
| DB-N5 | **`last_row_id` or `rowid` as an identifier.** Use `t.id()` (`TEXT`, generated). A table rebuild by a migration renumbers rowids.                                                                           | none                                                                                                                                             |
| DB-N6 | **SQLite extensions beyond core and JSON** (FTS5, R-Tree, math functions), pragmas, or a given SQLite version.                                                                                              | Anvil is built without them in dev until the contract lists them                                                                                 |
| DB-N7 | **A slow query finishing.** A statement over DB-L06 fails.                                                                                                                                                  | none: DB-L06 is enforced in both profiles                                                                                                        |
| DB-N8 | **Retrying a failed write being safe.** A `DB_UNAVAILABLE` after the write was sent may hide a commit. Make writes idempotent (`INSERT … ON CONFLICT DO NOTHING`).                                          | report `DB_UNAVAILABLE` after committing, at random (0.5 %)                                                                                      |

## 6. Limits

The contract assumes the Workers Paid plan (open question 1). Source for every Cloudflare figure: [D1 limits](https://developers.cloudflare.com/d1/platform/limits/).

| Id     | Limit                                    | Cloudflare                       | Contract                                 |
| ------ | ---------------------------------------- | -------------------------------- | ---------------------------------------- |
| DB-L01 | Database size                            | 10 GB (Paid), 500 MB (Free)      | 10 GB                                    |
| DB-L02 | Bound parameters per statement           | 100                              | 100                                      |
| DB-L03 | SQL statement length                     | 100,000 bytes                    | 100,000 bytes                            |
| DB-L04 | String, BLOB or row size                 | 2,000,000 bytes                  | 2,000,000 bytes                          |
| DB-L05 | Bound value types                        | no `bigint`, no `undefined`      | `null`, `number`, `string`, `Uint8Array` |
| DB-L06 | Duration of one statement                | 30 s                             | 30 s                                     |
| DB-L07 | Queries per call (a batch counts as one) | 1,000 (Paid), 50 (Free)          | 1,000                                    |
| DB-L08 | Columns per table, and per result        | 100                              | 100                                      |
| DB-L09 | Result size of one statement             | 50 MB (enforced from 2026-11-04) | 50 MB                                    |
| DB-L10 | `LIKE` / `GLOB` pattern                  | 50 bytes                         | 50 bytes                                 |
| DB-L11 | Terms of a compound `SELECT`             | 5                                | 5                                        |
| DB-L12 | Arguments of an SQL function             | 32                               | 32                                       |
| DB-L13 | Statements per batch                     | not stated: **UNVERIFIED**       | 100 (proposed; open question 3)          |

## 7. Errors

| Code                         | Retryable | When                                                                                                                                                                                              |
| ---------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DB_CONSTRAINT`              | no        | A `NOT NULL`, `UNIQUE`, `CHECK` or foreign key refused the write. `details.constraint` is `not_null`, `unique`, `check` or `foreign_key`, with the table and column when the provider knows them. |
| `DB_SYNTAX`                  | no        | The statement does not parse, or names a missing table or column.                                                                                                                                 |
| `DB_TYPE`                    | no        | A bound value is `undefined`, a `bigint`, or another unsupported type (DB-L05).                                                                                                                   |
| `DB_TRANSACTION_UNSUPPORTED` | no        | `BEGIN`, `COMMIT`, `ROLLBACK`, `SAVEPOINT`, `RELEASE`, or Kysely's `transaction()` (DB-11).                                                                                                       |
| `DB_FORBIDDEN`               | no        | `ATTACH`, `DETACH`, or a pragma write (DB-12).                                                                                                                                                    |
| `DB_LIMIT`                   | no        | A statement over DB-L02, L03, L04, L08, L10–L13. `details.limit` names it.                                                                                                                        |
| `DB_TIMEOUT`                 | yes       | A statement ran over DB-L06.                                                                                                                                                                      |
| `DB_FULL`                    | no        | The database reached DB-L01.                                                                                                                                                                      |
| `DB_UNAVAILABLE`             | yes       | The provider could not reach the database. The write may have committed (DB-N8).                                                                                                                  |

## 8. Conformance

| Case    | Proves       | What it does                                                                                                               |
| ------- | ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| DB-01.a | DB-01        | `CHECK`, type affinity, `json_valid`, `json_extract` behave as SQLite documents                                            |
| DB-02.a | DB-02        | a multi-row `INSERT` with one bad row leaves no row                                                                        |
| DB-03.a | DB-03        | a batch whose last statement violates `NOT NULL` leaves 0 rows of the earlier ones (the D-012 test, against each provider) |
| DB-03.b | DB-03        | same with a foreign key failure across two tables                                                                          |
| DB-04.a | DB-04        | `INSERT` then `INSERT … SELECT` from it in one batch                                                                       |
| DB-05.a | DB-05        | 50 concurrent batches incrementing a counter with `UPDATE … SET n = n + 1` then reading it: every read is a distinct value |
| DB-06.a | DB-06        | write then read in one call, 100 times                                                                                     |
| DB-07.a | DB-07        | write in call A, read in call B started after A resolved                                                                   |
| DB-08.a | DB-08        | round-trip `null`, integers to 2^53, reals, empty and non-ASCII strings, 0- and 1 MB byte arrays                           |
| DB-09.a | DB-09        | each constraint kind refuses, with `DB_CONSTRAINT` and the right `details.constraint`                                      |
| DB-09.b | DB-09        | `ON DELETE CASCADE` and `SET NULL` apply                                                                                   |
| DB-10.a | DB-10        | Anvil only: kill the process after a resolved write, restart, read it                                                      |
| DB-11.a | DB-11        | each transaction keyword, alone and in a batch, gives `DB_TRANSACTION_UNSUPPORTED`                                         |
| DB-12.a | DB-12        | `ATTACH`, `PRAGMA foreign_keys = OFF` give `DB_FORBIDDEN`; tool A cannot see tool B's table of the same name               |
| DB-13.a | DB-13        | two channels of one tool: a write in one is absent from the other                                                          |
| DB-14.a | DB-14        | a migration that fails halfway leaves no table and no `_forgeron_migrations` row                                           |
| DB-L.a  | DB-L02–L13   | one case per limit: at the limit succeeds, over it fails with `DB_LIMIT`, `DB_TYPE` or `DB_TIMEOUT`                        |
| DB-N.a  | DB-N1–N3, N8 | Anvil dev: each chaos happens at least once over 1,000 runs                                                                |

## 9. Open questions

1. **Which Cloudflare plan the limits assume.** Forgeron Cloud runs on Workers for Platforms (Paid). A self-hosted install may run on a Free account (500 MB, 50 queries per call). Recommendation: the contract adopts Paid figures and `forgeron platform install` refuses a Free account, rather than shrinking every tool to Free limits.
2. **Read replication.** D1 replicas need the Sessions API, and reads outside a session go to the primary. If the Cloudflare provider ever uses replicas, DB-07 breaks unless a bookmark travels between calls. Recommendation: keep `withSession` out of `database@1` and the provider on the primary; revisit with `database@2`, carrying the bookmark in the gateway per person.
3. **Statements per batch.** D1 does not state a maximum on the pages fetched. Recommendation: adopt 100, measure on a remote D1, and raise it if D1 allows more.
4. **DB-05 and DB-10 on a remote D1.** Both are marked UNVERIFIED. Recommendation: make the probe Worker's run of DB-05.a and a durability check the condition for marking `database@1` accepted, as D-012 already asked for atomicity.
5. **Where `sync` event handlers write.** D-012 says a handler's writes should join the action's batch (FOR-16), which is not built: today a `sync` handler writes in its own statements (`templates/crm/events/deal-history.ts`), so "an error cancels the action" holds only for what is not written yet. Not a contract matter, but DB-N2 is what a tool meets until it is built. Recommendation: build FOR-16 before calling the contract done.
