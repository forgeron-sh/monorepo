import type { BuildMigration } from "@forgeron/hosting";
import { st } from "../../kernel/sql";

// Migrations owned by the connections module; the number is global (the order is the name, see ../../migrations.ts).
export const connectionsMigrations: BuildMigration[] = [
  {
    // A person's OAuth consent for a delegated connector (docs/sdk.md section 10): the tokens,
    // sealed, per tool, environment, person and connector.
    name: "0004_connections",
    fingerprint: "connections-v1",
    destructive: false,
    up: [
      st(`CREATE TABLE "connections" (
  "tool_id" TEXT NOT NULL REFERENCES "tools" ("id") ON DELETE CASCADE,
  "environment" TEXT NOT NULL CHECK ("environment" IN ('preview', 'pilot', 'production')),
  "user_id" TEXT NOT NULL,
  "connector" TEXT NOT NULL,
  "scopes" TEXT NOT NULL,
  "expires_at" TEXT,
  "iv" TEXT NOT NULL,
  "ciphertext" TEXT NOT NULL,
  "created_at" TEXT NOT NULL,
  "updated_at" TEXT NOT NULL,
  PRIMARY KEY ("tool_id", "environment", "user_id", "connector")
)`),
    ],
    down: [st(`DROP TABLE "connections"`)],
  },
];
