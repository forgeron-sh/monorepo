import type { BuildMigration } from "@forgeron/hosting";
import { st } from "../../kernel/sql";

// Migrations owned by the secrets module; the number is global (the order is the name, see ../../migrations.ts).
export const secretsMigrations: BuildMigration[] = [
  {
    name: "0003_secrets",
    fingerprint: "secrets-v1",
    destructive: false,
    up: [
      st(`CREATE TABLE "secrets" (
  "tool_id" TEXT NOT NULL REFERENCES "tools" ("id") ON DELETE CASCADE,
  "environment" TEXT NOT NULL CHECK ("environment" IN ('preview', 'pilot', 'production')),
  "name" TEXT NOT NULL,
  "iv" TEXT NOT NULL,
  "ciphertext" TEXT NOT NULL,
  "updated_at" TEXT NOT NULL,
  PRIMARY KEY ("tool_id", "environment", "name")
)`),
    ],
    down: [st(`DROP TABLE "secrets"`)],
  },
  {
    // Per-person secrets (D-036): one per tool, person and name, sealed with the platform key. The
    // value is read back only by the gateway, to hand the caller's own to the tool they call.
    name: "0013_user_secrets",
    fingerprint: "user-secrets-v1",
    destructive: false,
    up: [
      st(`CREATE TABLE "user_secrets" (
  "tool_id" TEXT NOT NULL,
  "person" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "iv" TEXT NOT NULL,
  "ciphertext" TEXT NOT NULL,
  "updated_at" TEXT NOT NULL,
  PRIMARY KEY ("tool_id", "person", "name")
)`),
    ],
    down: [st(`DROP TABLE "user_secrets"`)],
  },
  {
    // Secret requests (D-083): a short-lived, single-use link to the page where a person types a
    // tool secret themselves. Only the hash of the link's token is kept, never the token. `claim` is
    // set by the batch that spends the link, so the secret and its audit line are written only by
    // the batch that won.
    name: "0023_secret_requests",
    fingerprint: "secret-requests-v1",
    destructive: false,
    up: [
      st(`CREATE TABLE "secret_requests" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "token_hash" TEXT NOT NULL UNIQUE,
  "tool_id" TEXT NOT NULL REFERENCES "tools" ("id") ON DELETE CASCADE,
  "environment" TEXT NOT NULL CHECK ("environment" IN ('preview', 'pilot', 'production')),
  "name" TEXT NOT NULL,
  "person" TEXT NOT NULL,
  "created_at" TEXT NOT NULL,
  "expires_at" TEXT NOT NULL,
  "used_at" TEXT,
  "claim" TEXT
)`),
    ],
    down: [st(`DROP TABLE "secret_requests"`)],
  },
];
