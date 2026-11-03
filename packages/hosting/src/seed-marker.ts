// How a new preview gets its seed when the deployer cannot run it (D-035). The gateway is a Worker:
// it does not evaluate a tool's `db/seed.ts`, and in self-host it only reaches a new tool Worker
// after it has redeployed itself with the binding. So `deploy` leaves a marker in the new database,
// and the tool's own Worker, which holds the seed and the database, claims it on its first request
// (`packages/compiler/src/build.ts`, which holds the other half of this contract).
import type { D1Database } from "./migrate";

const SEED_TABLE = "_forgeron_seed";

const CREATE = `CREATE TABLE IF NOT EXISTS "${SEED_TABLE}" ("status" TEXT NOT NULL, "detail" TEXT)`;

/** `pending`, then `running`, then `done`, or `failed` with the reason in `detail`. */
export async function markSeedPending(db: D1Database): Promise<void> {
  await db.batch([
    db.prepare(CREATE),
    db.prepare(`DELETE FROM "${SEED_TABLE}"`),
    db.prepare(`INSERT INTO "${SEED_TABLE}" ("status") VALUES ('pending')`),
  ]);
}

/** The state of a preview's seed, or `undefined` when nothing was left to the Worker. */
export async function seedStatus(db: D1Database): Promise<string | undefined> {
  try {
    const rows = (await db.prepare(`SELECT "status" FROM "${SEED_TABLE}"`).all()).results as {
      status: string;
    }[];
    return rows[0]?.status;
  } catch {
    return undefined;
  }
}
