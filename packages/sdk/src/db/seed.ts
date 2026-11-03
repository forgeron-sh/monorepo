import type { ContextDb } from "../context";

// `db/seed.ts` (docs/sdk.md §8): `export default seed(async ({ db }) => { … })`. It fills the local
// database (`forgeron db seed`) and the database of a test (`createTestTool({ seed: true })`).

export interface SeedContext {
  /** The tool's database, typed by its schema, with the tables of the last migration in place. */
  db: ContextDb;
}

export interface SeedDefinition {
  readonly kind: "seed";
  run(ctx: SeedContext): void | Promise<void>;
}

/**
 * Declares what to put in an empty database. Write it so that it can run on an empty one: it is not
 * run again on data. No fake-data library is bundled: import the one you like (`@faker-js/faker`).
 */
export const seed = (run: SeedDefinition["run"]): SeedDefinition => ({ kind: "seed", run });
