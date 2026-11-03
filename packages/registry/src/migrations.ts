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
  {
    // Pilot groups (D-034): a group is a name in a workspace and the members it holds. The pilot
    // environment of a tool names the group that gets its version at the production address.
    name: "0011_group_members",
    fingerprint: "group-members-v1",
    destructive: false,
    up: [
      st(`CREATE TABLE "group_members" (
  "workspace" TEXT NOT NULL,
  "group_name" TEXT NOT NULL,
  "member_id" TEXT NOT NULL,
  PRIMARY KEY ("workspace", "group_name", "member_id"),
  FOREIGN KEY ("workspace", "member_id") REFERENCES "members" ("workspace", "id") ON DELETE CASCADE
)`),
    ],
    down: [st(`DROP TABLE "group_members"`)],
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
    // The matrix edits (D-039) are audited: `access` joins the kinds of the audit log. SQLite cannot
    // change a CHECK, so the table is rebuilt with its rows.
    name: "0014_audit_access",
    fingerprint: "audit-access-v1",
    destructive: false,
    up: [
      st(`CREATE TABLE "audit_log_next" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "at" TEXT NOT NULL,
  "tool_id" TEXT,
  "actor" TEXT NOT NULL,
  "interface" TEXT,
  "via" TEXT,
  "kind" TEXT NOT NULL CHECK ("kind" IN ('action', 'deployment', 'promotion', 'rollback', 'approval', 'access')),
  "subject" TEXT NOT NULL,
  "version_id" TEXT,
  "result" TEXT NOT NULL CHECK ("result" IN ('ok', 'denied', 'error')),
  "detail" TEXT
)`),
      st(
        `INSERT INTO "audit_log_next" SELECT "id", "at", "tool_id", "actor", "interface", "via", "kind", "subject", "version_id", "result", "detail" FROM "audit_log" ORDER BY "rowid"`,
      ),
      st(`DROP TABLE "audit_log"`),
      st(`ALTER TABLE "audit_log_next" RENAME TO "audit_log"`),
      st(`CREATE INDEX "audit_log_by_tool" ON "audit_log" ("tool_id", "at")`),
    ],
    down: [],
  },
  {
    // The workspace's sign-in provider and the OAuth clients of its delegated connectors (D-041).
    // Client secrets are sealed (iv + ciphertext), never stored in the clear.
    name: "0015_identity_config",
    fingerprint: "identity-config-v1",
    destructive: false,
    up: [
      st(`CREATE TABLE "identity_providers" (
  "workspace" TEXT NOT NULL PRIMARY KEY,
  "kind" TEXT NOT NULL CHECK ("kind" IN ('oidc', 'entra', 'google')),
  "issuer" TEXT,
  "client_id" TEXT NOT NULL,
  "tenant" TEXT,
  "hosted_domain" TEXT,
  "email_claim" TEXT,
  "groups_claim" TEXT,
  "group_roles" TEXT NOT NULL,
  "iv" TEXT,
  "ciphertext" TEXT,
  "updated_by" TEXT NOT NULL,
  "updated_at" TEXT NOT NULL
)`),
      st(`CREATE TABLE "connector_clients" (
  "workspace" TEXT NOT NULL,
  "connector" TEXT NOT NULL,
  "authorize_url" TEXT NOT NULL,
  "token_url" TEXT NOT NULL,
  "client_id" TEXT NOT NULL,
  "iv" TEXT,
  "ciphertext" TEXT,
  "updated_by" TEXT NOT NULL,
  "updated_at" TEXT NOT NULL,
  PRIMARY KEY ("workspace", "connector")
)`),
    ],
    down: [st(`DROP TABLE "connector_clients"`), st(`DROP TABLE "identity_providers"`)],
  },
  {
    // Sign-in by email (D-049): the one-time codes (stored hashed, never in the clear), the pending
    // invitations, and the workspace's allowed email domains with the role their people join with.
    name: "0016_email_sign_in",
    fingerprint: "email-sign-in-v1",
    destructive: false,
    up: [
      st(`CREATE TABLE "email_codes" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "workspace" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "code_hash" TEXT NOT NULL,
  "ip_hash" TEXT NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "created_at" TEXT NOT NULL,
  "expires_at" TEXT NOT NULL,
  "used_at" TEXT
)`),
      st(
        `CREATE INDEX "email_codes_by_email" ON "email_codes" ("workspace", "email", "created_at")`,
      ),
      st(
        `CREATE INDEX "email_codes_by_ip" ON "email_codes" ("workspace", "ip_hash", "created_at")`,
      ),
      st(`CREATE TABLE "invitations" (
  "workspace" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "roles" TEXT NOT NULL,
  "invited_by" TEXT NOT NULL,
  "created_at" TEXT NOT NULL,
  "expires_at" TEXT NOT NULL,
  PRIMARY KEY ("workspace", "email")
)`),
      st(`CREATE TABLE "membership_settings" (
  "workspace" TEXT NOT NULL PRIMARY KEY,
  "domains" TEXT NOT NULL,
  "default_role" TEXT,
  "updated_by" TEXT NOT NULL,
  "updated_at" TEXT NOT NULL
)`),
    ],
    down: [
      st(`DROP TABLE "membership_settings"`),
      st(`DROP TABLE "invitations"`),
      st(`DROP TABLE "email_codes"`),
    ],
  },
  {
    // SAML sign-in (D-050): a workspace's SAML provider (pinned certificates, attribute mapping) and
    // the short-lived ids that bind a response to its request and refuse a replayed assertion.
    name: "0017_saml",
    fingerprint: "saml-v1",
    destructive: false,
    up: [
      st(`CREATE TABLE "saml_providers" (
  "workspace" TEXT NOT NULL PRIMARY KEY,
  "idp_entity_id" TEXT NOT NULL,
  "sso_url" TEXT NOT NULL,
  "certificates" TEXT NOT NULL,
  "email_attribute" TEXT,
  "groups_attribute" TEXT,
  "name_attribute" TEXT,
  "group_roles" TEXT NOT NULL,
  "updated_by" TEXT NOT NULL,
  "updated_at" TEXT NOT NULL
)`),
      st(`CREATE TABLE "saml_requests" (
  "workspace" TEXT NOT NULL,
  "id" TEXT NOT NULL,
  "kind" TEXT NOT NULL CHECK ("kind" IN ('request', 'assertion')),
  "expires_at" TEXT NOT NULL,
  PRIMARY KEY ("workspace", "id", "kind")
)`),
    ],
    down: [st(`DROP TABLE "saml_requests"`), st(`DROP TABLE "saml_providers"`)],
  },
  {
    // The console's files (D-052): `platform install` stores them so that the running gateway can
    // upload them again with each new version of itself (Cloudflare does not inherit assets). One row
    // per chunk of base64: a D1 statement is limited in size.
    name: "0018_gateway_assets",
    fingerprint: "gateway-assets-v1",
    destructive: false,
    up: [
      st(`CREATE TABLE "gateway_assets" (
  "path" TEXT NOT NULL,
  "part" INTEGER NOT NULL,
  "hash" TEXT NOT NULL,
  "size" INTEGER NOT NULL,
  "type" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  PRIMARY KEY ("path", "part")
)`),
    ],
    down: [st(`DROP TABLE "gateway_assets"`)],
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
];
