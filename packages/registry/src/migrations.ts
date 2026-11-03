// The schema of the platform D1. A migration is a list of SQL statements (D-014): applied, with its
// row in `_forgeron_migrations`, in one batch. Nobody uses the platform yet: no data-keeping step.
import type { BuildMigration } from "@forgeron/hosting";

const st = (sql: string) => ({ sql, parameters: [] });

export const platformMigrations: BuildMigration[] = [
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
    // rebuilding), the pilot group, and the history of what each environment served and who put it there.
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
];
