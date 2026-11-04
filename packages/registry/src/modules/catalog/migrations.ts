import type { BuildMigration } from "@forgeron/hosting";
import { st } from "../../kernel/sql";

// Migrations owned by the catalog module; the number is global (the order is the name, see ../../migrations.ts).
export const catalogMigrations: BuildMigration[] = [
  {
    name: "0001_registry",
    fingerprint: "registry-v1",
    destructive: false,
    up: [
      st(`CREATE TABLE "tools" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "workspace" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "created_at" TEXT NOT NULL,
  UNIQUE ("workspace", "name")
)`),
      st(`CREATE TABLE "builds" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "tool_id" TEXT NOT NULL REFERENCES "tools" ("id") ON DELETE CASCADE,
  "fingerprint" TEXT NOT NULL,
  "manifest" TEXT NOT NULL,
  "changelog" TEXT,
  "created_at" TEXT NOT NULL,
  UNIQUE ("tool_id", "fingerprint")
)`),
      st(`CREATE TABLE "versions" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "tool_id" TEXT NOT NULL REFERENCES "tools" ("id") ON DELETE CASCADE,
  "build_id" TEXT NOT NULL REFERENCES "builds" ("id") ON DELETE CASCADE,
  "version" TEXT NOT NULL,
  "created_at" TEXT NOT NULL,
  UNIQUE ("tool_id", "version")
)`),
      st(`CREATE TABLE "environments" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "tool_id" TEXT NOT NULL REFERENCES "tools" ("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL CHECK ("name" IN ('preview', 'pilot', 'production')),
  "branch" TEXT NOT NULL DEFAULT '',
  "version_id" TEXT REFERENCES "versions" ("id") ON DELETE SET NULL,
  "url" TEXT,
  "activated_at" TEXT,
  "created_at" TEXT NOT NULL,
  UNIQUE ("tool_id", "name", "branch")
)`),
      st(`CREATE TABLE "approvals" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "tool_id" TEXT NOT NULL REFERENCES "tools" ("id") ON DELETE CASCADE,
  "version_id" TEXT NOT NULL REFERENCES "versions" ("id") ON DELETE CASCADE,
  "resource" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending' CHECK ("status" IN ('pending', 'approved', 'rejected')),
  "requested_at" TEXT NOT NULL,
  "decided_by" TEXT,
  "decided_at" TEXT,
  UNIQUE ("version_id", "resource")
)`),
      st(`CREATE INDEX "versions_by_tool" ON "versions" ("tool_id")`),
      st(`CREATE INDEX "environments_by_tool" ON "environments" ("tool_id")`),
      st(`CREATE INDEX "approvals_by_status" ON "approvals" ("tool_id", "status")`),
    ],
    down: [
      st(`DROP TABLE "approvals"`),
      st(`DROP TABLE "environments"`),
      st(`DROP TABLE "versions"`),
      st(`DROP TABLE "builds"`),
      st(`DROP TABLE "tools"`),
    ],
  },
  {
    // What promotion and rollback need: the build's code (to put it on another environment without
    // rebuilding), and the history of what each environment served and who put it there.
    name: "0002_deployments",
    fingerprint: "deployments-v1",
    destructive: false,
    up: [
      st(`ALTER TABLE "builds" ADD COLUMN "worker" TEXT`),
      st(`ALTER TABLE "builds" ADD COLUMN "migrations" TEXT`),
      st(`ALTER TABLE "environments" ADD COLUMN "pilot_group" TEXT`),
      st(`CREATE TABLE "deployments" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "tool_id" TEXT NOT NULL REFERENCES "tools" ("id") ON DELETE CASCADE,
  "environment_id" TEXT NOT NULL REFERENCES "environments" ("id") ON DELETE CASCADE,
  "version_id" TEXT NOT NULL REFERENCES "versions" ("id") ON DELETE CASCADE,
  "kind" TEXT NOT NULL CHECK ("kind" IN ('deploy', 'promote', 'rollback')),
  "actor" TEXT NOT NULL,
  "created_at" TEXT NOT NULL
)`),
      st(`CREATE INDEX "deployments_by_environment" ON "deployments" ("environment_id")`),
    ],
    down: [
      st(`DROP TABLE "deployments"`),
      st(`ALTER TABLE "environments" DROP COLUMN "pilot_group"`),
      st(`ALTER TABLE "builds" DROP COLUMN "migrations"`),
      st(`ALTER TABLE "builds" DROP COLUMN "worker"`),
    ],
  },
  {
    // The pilot environment is gone (D-055): a version goes from a preview to production. An
    // installed platform keeps no trace of it: the pilot environments and what they held (secrets,
    // connections, deployments, per-person secrets), the pilot group of each environment and the
    // groups themselves. SQLite cannot change a CHECK or drop a column that a table needs: the tables
    // that name the environments are rebuilt without 'pilot'. `deployments` is copied aside because
    // dropping `environments` cascades into it. The Worker of a pilot is not deleted here (a
    // migration only reaches the database) nor by `platform install`: once its environment row is
    // gone the install no longer carries its `TOOL_*_PILOT` binding over, so the Worker is
    // unreachable and stays on the account until someone deletes it.
    name: "0019_remove_pilot",
    // Not flagged destructive: the flag guards the data of a tool (D-014); this deletes the rows of a
    // retired feature in the platform's own database, and `platform install` must be able to apply it.
    fingerprint: "remove-pilot-v1",
    destructive: false,
    up: [
      st(`DROP TABLE "group_members"`),
      st(`DELETE FROM "secrets" WHERE "environment" = 'pilot'`),
      st(`DELETE FROM "connections" WHERE "environment" = 'pilot'`),
      st(`CREATE TABLE "secrets_next" (
  "tool_id" TEXT NOT NULL REFERENCES "tools" ("id") ON DELETE CASCADE,
  "environment" TEXT NOT NULL CHECK ("environment" IN ('preview', 'production')),
  "name" TEXT NOT NULL,
  "iv" TEXT NOT NULL,
  "ciphertext" TEXT NOT NULL,
  "updated_at" TEXT NOT NULL,
  PRIMARY KEY ("tool_id", "environment", "name")
)`),
      st(`INSERT INTO "secrets_next" SELECT * FROM "secrets"`),
      st(`DROP TABLE "secrets"`),
      st(`ALTER TABLE "secrets_next" RENAME TO "secrets"`),
      st(`CREATE TABLE "connections_next" (
  "tool_id" TEXT NOT NULL REFERENCES "tools" ("id") ON DELETE CASCADE,
  "environment" TEXT NOT NULL CHECK ("environment" IN ('preview', 'production')),
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
      st(`INSERT INTO "connections_next" SELECT * FROM "connections"`),
      st(`DROP TABLE "connections"`),
      st(`ALTER TABLE "connections_next" RENAME TO "connections"`),
      st(
        `CREATE TABLE "deployments_keep" AS SELECT d.* FROM "deployments" d JOIN "environments" e ON e."id" = d."environment_id" WHERE e."name" <> 'pilot'`,
      ),
      st(`DROP TABLE "deployments"`),
      st(`CREATE TABLE "environments_next" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "tool_id" TEXT NOT NULL REFERENCES "tools" ("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL CHECK ("name" IN ('preview', 'production')),
  "branch" TEXT NOT NULL DEFAULT '',
  "version_id" TEXT REFERENCES "versions" ("id") ON DELETE SET NULL,
  "url" TEXT,
  "activated_at" TEXT,
  "created_at" TEXT NOT NULL,
  UNIQUE ("tool_id", "name", "branch")
)`),
      st(
        `INSERT INTO "environments_next" SELECT "id", "tool_id", "name", "branch", "version_id", "url", "activated_at", "created_at" FROM "environments" WHERE "name" <> 'pilot'`,
      ),
      st(`DROP TABLE "environments"`),
      st(`ALTER TABLE "environments_next" RENAME TO "environments"`),
      st(`CREATE INDEX "environments_by_tool" ON "environments" ("tool_id")`),
      st(`CREATE TABLE "deployments" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "tool_id" TEXT NOT NULL REFERENCES "tools" ("id") ON DELETE CASCADE,
  "environment_id" TEXT NOT NULL REFERENCES "environments" ("id") ON DELETE CASCADE,
  "version_id" TEXT NOT NULL REFERENCES "versions" ("id") ON DELETE CASCADE,
  "kind" TEXT NOT NULL CHECK ("kind" IN ('deploy', 'promote', 'rollback')),
  "actor" TEXT NOT NULL,
  "created_at" TEXT NOT NULL
)`),
      st(`INSERT INTO "deployments" SELECT * FROM "deployments_keep"`),
      st(`DROP TABLE "deployments_keep"`),
      st(`CREATE INDEX "deployments_by_environment" ON "deployments" ("environment_id")`),
    ],
    // Nothing to put back: the pilot data is deleted.
    down: [],
  },
  {
    // What the console shows beside each deployment (D-056): the commit that was deployed, as CI
    // knows it. Nullable: a deployment made before this, or by a client that sends nothing, has none.
    name: "0020_deployment_commit",
    fingerprint: "deployment-commit-v1",
    destructive: false,
    up: [
      st(`ALTER TABLE "deployments" ADD COLUMN "commit_sha" TEXT`),
      st(`ALTER TABLE "deployments" ADD COLUMN "commit_message" TEXT`),
      st(`ALTER TABLE "deployments" ADD COLUMN "commit_author" TEXT`),
    ],
    down: [
      st(`ALTER TABLE "deployments" DROP COLUMN "commit_author"`),
      st(`ALTER TABLE "deployments" DROP COLUMN "commit_message"`),
      st(`ALTER TABLE "deployments" DROP COLUMN "commit_sha"`),
    ],
  },
  {
    // The documentation of a version for the catalog (D-061): the README and the images it references.
    // The content is stored once per tool and hash (a version that keeps an image does not copy it),
    // chunked like the gateway's code (a D1 statement is limited in size); each build lists its files.
    // Only creates tables: an installed platform keeps everything it has.
    name: "0021_tool_docs",
    fingerprint: "tool-docs-v1",
    destructive: false,
    up: [
      st(`CREATE TABLE "docs_blobs" (
  "tool_id" TEXT NOT NULL REFERENCES "tools" ("id") ON DELETE CASCADE,
  "hash" TEXT NOT NULL,
  "part" INTEGER NOT NULL,
  "content" TEXT NOT NULL,
  PRIMARY KEY ("tool_id", "hash", "part")
)`),
      st(`CREATE TABLE "build_docs" (
  "build_id" TEXT NOT NULL REFERENCES "builds" ("id") ON DELETE CASCADE,
  "path" TEXT NOT NULL,
  "hash" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "size" INTEGER NOT NULL,
  PRIMARY KEY ("build_id", "path")
)`),
    ],
    down: [st(`DROP TABLE "build_docs"`), st(`DROP TABLE "docs_blobs"`)],
  },
];
