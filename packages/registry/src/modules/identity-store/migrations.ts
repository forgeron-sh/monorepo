import type { BuildMigration } from "@forgeron/hosting";
import { st } from "../../kernel/sql";

// Migrations owned by the identity-store module; the number is global (the order is the name, see ../../migrations.ts).
export const identityStoreMigrations: BuildMigration[] = [
  {
    // The one-time codes of `forgeron login` (D-028): a code is spent by recording its id here.
    name: "0009_cli_codes",
    fingerprint: "cli-codes-v1",
    destructive: false,
    up: [
      st(`CREATE TABLE "cli_codes" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "expires_at" TEXT NOT NULL
)`),
    ],
    down: [st(`DROP TABLE "cli_codes"`)],
  },
  {
    // Revoked tokens (D-035): one row per revoked token (`jti`), or, with no `jti`, every token of the
    // person issued up to `at` (seconds). A row is forgotten once no token it covers can be valid.
    name: "0012_token_revocations",
    fingerprint: "token-revocations-v1",
    destructive: false,
    up: [
      st(`CREATE TABLE "token_revocations" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "workspace" TEXT NOT NULL,
  "person" TEXT NOT NULL,
  "jti" TEXT,
  "at" INTEGER NOT NULL,
  "expires_at" TEXT NOT NULL
)`),
      st(`CREATE INDEX "token_revocations_person" ON "token_revocations" ("workspace", "person")`),
    ],
    down: [st(`DROP TABLE "token_revocations"`)],
  },
];
