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
  {
    // Per-person plain values of a tool's setup (D-097): a first name, a team. Not secrets: kept in
    // clear, one per tool, person and name, removed with the person.
    name: "0026_user_setup",
    fingerprint: "user-setup-v1",
    destructive: false,
    up: [
      st(`CREATE TABLE "user_setup" (
  "tool_id" TEXT NOT NULL REFERENCES "tools" ("id") ON DELETE CASCADE,
  "person" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "updated_at" TEXT NOT NULL,
  PRIMARY KEY ("tool_id", "person", "name")
)`),
    ],
    down: [st(`DROP TABLE "user_setup"`)],
  },
  {
    // The registry of a person's secrets (D-104): a secret has a stable id, immutable numbered versions,
    // and bindings that say which tool field uses it, in which scope, and which version. `aad` is the
    // additional data a version was sealed with, so values sealed before this migration keep opening.
    name: "0027_secret_registry",
    fingerprint: "secret-registry-v1",
    destructive: false,
    up: [
      st(`CREATE TABLE "person_secrets" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "workspace" TEXT NOT NULL,
  "person" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "kind" TEXT,
  "created_at" TEXT NOT NULL,
  "archived_at" TEXT
)`),
      st(`CREATE INDEX "person_secrets_by_person" ON "person_secrets" ("workspace", "person")`),
      st(`CREATE TABLE "person_secret_versions" (
  "secret_id" TEXT NOT NULL REFERENCES "person_secrets" ("id") ON DELETE CASCADE,
  "version" INTEGER NOT NULL,
  "iv" TEXT NOT NULL,
  "ciphertext" TEXT NOT NULL,
  "aad" TEXT NOT NULL,
  "created_at" TEXT NOT NULL,
  "created_by" TEXT NOT NULL,
  "via" TEXT NOT NULL,
  PRIMARY KEY ("secret_id", "version")
)`),
      st(`CREATE TABLE "secret_bindings" (
  "tool_id" TEXT NOT NULL REFERENCES "tools" ("id") ON DELETE CASCADE,
  "person" TEXT NOT NULL,
  "field" TEXT NOT NULL,
  "scope" TEXT NOT NULL CHECK ("scope" IN ('*', 'production', 'preview') OR "scope" LIKE 'preview:%'),
  "secret_id" TEXT NOT NULL REFERENCES "person_secrets" ("id") ON DELETE CASCADE,
  "pin" INTEGER,
  PRIMARY KEY ("tool_id", "person", "field", "scope")
)`),
      st(`CREATE INDEX "secret_bindings_by_secret" ON "secret_bindings" ("secret_id")`),
      // The conversion of `user_secrets` (D-036): each row becomes a secret, its version 1 and a tool-wide
      // binding. The value is not opened: the version keeps the additional data it was sealed with.
      st(`INSERT INTO "person_secrets" ("id", "workspace", "person", "label", "kind", "created_at", "archived_at")
SELECT 'sec_l' || u."rowid", t."workspace", u."person", u."name", NULL, u."updated_at", NULL
FROM "user_secrets" u JOIN "tools" t ON t."id" = u."tool_id"`),
      st(`INSERT INTO "person_secret_versions" ("secret_id", "version", "iv", "ciphertext", "aad", "created_at", "created_by", "via")
SELECT 'sec_l' || u."rowid", 1, u."iv", u."ciphertext", 'user/' || u."tool_id" || '/' || u."person" || '/' || u."name", u."updated_at", u."person", 'legacy'
FROM "user_secrets" u JOIN "tools" t ON t."id" = u."tool_id"`),
      st(`INSERT INTO "secret_bindings" ("tool_id", "person", "field", "scope", "secret_id", "pin")
SELECT u."tool_id", u."person", u."name", '*', 'sec_l' || u."rowid", NULL
FROM "user_secrets" u JOIN "tools" t ON t."id" = u."tool_id"`),
    ],
    down: [
      st(`DROP TABLE "secret_bindings"`),
      st(`DROP TABLE "person_secret_versions"`),
      st(`DROP TABLE "person_secrets"`),
    ],
  },
];
