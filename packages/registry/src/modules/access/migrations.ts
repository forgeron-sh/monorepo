import type { BuildMigration } from "@forgeron/hosting";
import { st } from "../../kernel/sql";

// Migrations owned by the access module; the number is global (the order is the name, see ../../migrations.ts).
export const accessMigrations: BuildMigration[] = [
  {
    // The roles × actions matrix of a tool, as an admin edits it in the console (docs/sdk.md §3):
    // one row per cell that differs from what the manifest's levels say. No version involved.
    name: "0006_role_access",
    fingerprint: "role-access-v1",
    destructive: false,
    up: [
      st(`CREATE TABLE "role_access" (
  "tool_id" TEXT NOT NULL REFERENCES "tools" ("id") ON DELETE CASCADE,
  "role" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "allowed" INTEGER NOT NULL CHECK ("allowed" IN (0, 1)),
  "updated_by" TEXT NOT NULL,
  "updated_at" TEXT NOT NULL,
  PRIMARY KEY ("tool_id", "role", "action")
)`),
    ],
    down: [st(`DROP TABLE "role_access"`)],
  },
];
