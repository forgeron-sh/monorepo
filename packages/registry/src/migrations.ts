// The schema of the platform D1. A migration is a list of SQL statements (D-014): applied, with its
// row in `_forgeron_migrations`, in one batch. Nobody uses the platform yet: no data-keeping step.
//
// Each module owns the SQL of its tables, but the order is global: a migration name carries its
// number, and this list is the modules' lists sorted by name. Names, fingerprints and statements
// must never change once applied: `migrations.test.ts` compares the result with a frozen copy.
import type { BuildMigration } from "@forgeron/hosting";
import { accessMigrations } from "./modules/access/public";
import { auditMigrations } from "./modules/audit/public";
import { catalogMigrations } from "./modules/catalog/public";
import { connectionsMigrations } from "./modules/connections/public";
import { identityStoreMigrations } from "./modules/identity-store/public";
import { marketplacesMigrations } from "./modules/marketplaces/public";
import { membersMigrations } from "./modules/members/public";
import { secretsMigrations } from "./modules/secrets/public";
import { templatesMigrations } from "./modules/templates/public";
import { usageMigrations } from "./modules/usage/public";
import { rootMigrations } from "./root-migrations";

/** The modules' lists in one list, ordered by name. A name used twice is a mistake: it throws. */
export function composeMigrations(lists: readonly (readonly BuildMigration[])[]): BuildMigration[] {
  const all = lists.flat();
  const names = new Set<string>();
  for (const migration of all) {
    if (names.has(migration.name))
      throw new Error(`The migration ${migration.name} is declared twice.`);
    names.add(migration.name);
  }
  return [...all].sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
}

export const platformMigrations: BuildMigration[] = composeMigrations([
  catalogMigrations,
  secretsMigrations,
  connectionsMigrations,
  auditMigrations,
  accessMigrations,
  membersMigrations,
  identityStoreMigrations,
  templatesMigrations,
  marketplacesMigrations,
  usageMigrations,
  rootMigrations,
]);
