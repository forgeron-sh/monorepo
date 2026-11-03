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
  {
    // The audit log (sdk.md §15): one line per action call, deployment, promotion, rollback and
    // approval. No foreign key: the log outlives the tool it is about.
    name: "0005_audit_log",
    fingerprint: "audit-log-v1",
    destructive: false,
    up: [
      st(`CREATE TABLE "audit_log" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "at" TEXT NOT NULL,
  "tool_id" TEXT,
  "actor" TEXT NOT NULL,
  "interface" TEXT,
  "via" TEXT,
  "kind" TEXT NOT NULL CHECK ("kind" IN ('action', 'deployment', 'promotion', 'rollback', 'approval')),
  "subject" TEXT NOT NULL,
  "version_id" TEXT,
  "result" TEXT NOT NULL CHECK ("result" IN ('ok', 'denied', 'error')),
  "detail" TEXT
)`),
      st(`CREATE INDEX "audit_log_by_tool" ON "audit_log" ("tool_id", "at")`),
    ],
    down: [st(`DROP TABLE "audit_log"`)],
  },
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
  {
    // Seats (D-024): a person is counted once per workspace and calendar month (UTC) when they made
    // an authenticated call. Only the workspace, the person's id and the month are kept.
    name: "0007_seats",
    fingerprint: "seats-v1",
    destructive: false,
    up: [
      st(`CREATE TABLE "seats" (
  "workspace" TEXT NOT NULL,
  "person_id" TEXT NOT NULL,
  "month" TEXT NOT NULL,
  PRIMARY KEY ("workspace", "month", "person_id")
)`),
    ],
    down: [st(`DROP TABLE "seats"`)],
  },
  {
    // Members (D-027): the people of a workspace, who they are at the identity provider (`subject`)
    // and their roles. The roles are a JSON array of names, resolved at each call (D-015).
    name: "0008_members",
    fingerprint: "members-v1",
    destructive: false,
    up: [
      st(`CREATE TABLE "members" (
  "workspace" TEXT NOT NULL,
  "id" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "roles" TEXT NOT NULL,
  "created_at" TEXT NOT NULL,
  PRIMARY KEY ("workspace", "id"),
  UNIQUE ("workspace", "subject")
)`),
    ],
    down: [st(`DROP TABLE "members"`)],
  },
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
    // The gateway's own `worker.js` (D-032): `forgeron platform install` stores it here so that the
    // running gateway can upload a new version of itself when a tool is bound. Chunks: a D1
    // statement is limited in size.
    name: "0010_gateway_code",
    fingerprint: "gateway-code-v1",
    destructive: false,
    up: [
      st(`CREATE TABLE "gateway_code" (
  "part" INTEGER PRIMARY KEY NOT NULL,
  "content" TEXT NOT NULL
)`),
    ],
    down: [st(`DROP TABLE "gateway_code"`)],
  },
];
