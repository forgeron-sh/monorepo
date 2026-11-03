// `@forgeron/sdk/db`: declare tables, and the types of `ctx.db` (docs/sdk.md §8).
export { sql } from "kysely";
export type { Insertable, Kysely, Selectable, Updateable } from "kysely";
export { t } from "./columns";
export type { Column, ColumnOf, OnDelete } from "./columns";
export { index, table, unique } from "./table";
export type { Table } from "./table";
export { schema } from "./schema";
export type { Batch, BatchResult, Compilable, DB, Database, Schema } from "./schema";
export { createSchemaSql } from "./ddl";
export {
  addColumnSql,
  createIndexSql,
  createTableSql,
  createTriggerSql,
  dropColumnSql,
  dropIndexSql,
  dropTriggerSql,
  indexName,
  PERSONAL_MARKER,
  quote,
  tableExtrasSql,
  triggerName,
} from "./ddl";
export { emptySnapshot, sameSnapshot, snapshotOf } from "./snapshot";
export type { ColumnSnapshot, Snapshot, TableSnapshot } from "./snapshot";
export { migration, resolveMigration } from "./migration";
export { seed } from "./seed";
export type { SeedContext, SeedDefinition } from "./seed";
export type {
  MigrationDefinition,
  MigrationOptions,
  MigrationStatement,
  MigrationSteps,
  ResolvedStatement,
} from "./migration";
