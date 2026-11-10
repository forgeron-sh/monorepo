import type { BuildMigration } from "@forgeron/hosting";
import { st } from "../../kernel/sql";

// Migrations owned by the marketplaces module; the number is global (the order is the name, see ../../migrations.ts).
export const marketplacesMigrations: BuildMigration[] = [
  {
    // The marketplaces a workspace added (D-116): a GitHub repository, and a read token sealed under
    // the slot `marketplace/<workspace>/<id>`. What a marketplace offers lives in the hidden workspace
    // `@mp:<id>`, as tools, builds and versions.
    name: "0029_marketplaces",
    fingerprint: "marketplaces-v1",
    destructive: false,
    up: [
      st(`CREATE TABLE "marketplaces" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "workspace" TEXT NOT NULL,
  "repo" TEXT NOT NULL,
  "title" TEXT,
  "iv" TEXT,
  "ciphertext" TEXT,
  "created_by" TEXT NOT NULL,
  "created_at" TEXT NOT NULL,
  "synced_at" TEXT,
  "sync_error" TEXT,
  UNIQUE ("workspace", "repo")
)`),
    ],
    down: [st(`DROP TABLE "marketplaces"`)],
  },
];
