import type { BuildMigration } from "@forgeron/hosting";
import { st } from "./kernel/sql";

/** The workspaces the install knows: where a built-in team is needed. */
const WORKSPACE_SOURCES = ["members", "invitations", "teams", "tools"];

/** The role names a JSON array holds, ignoring a value that is not valid JSON or not a string. */
const ELEMENTS = (column: string) =>
  `json_each(CASE WHEN json_valid(${column}) THEN ${column} ELSE '[]' END)`;

/**
 * Where a role is held, one SELECT of (workspace, role) each. They are inserted one statement per
 * source: workerd's SQLite refuses a compound SELECT with many terms (the in-memory D1 does not).
 */
const HELD_ROLES = [
  `SELECT m."workspace", j."value" FROM "members" m, ${ELEMENTS('m."roles"')} j WHERE j."type" = 'text'`,
  `SELECT i."workspace", j."value" FROM "invitations" i, ${ELEMENTS('i."roles"')} j WHERE j."type" = 'text'`,
  `SELECT "workspace", "default_role" FROM "membership_settings" WHERE "default_role" IS NOT NULL`,
  `SELECT p."workspace", j."value" FROM "identity_providers" p, json_each(CASE WHEN json_valid(p."group_roles") THEN p."group_roles" ELSE '{}' END) j WHERE j."type" = 'text'`,
  `SELECT p."workspace", j."value" FROM "saml_providers" p, json_each(CASE WHEN json_valid(p."group_roles") THEN p."group_roles" ELSE '{}' END) j WHERE j."type" = 'text'`,
];

/** The role names that are not held by a member but named by a tool's rows. */
const NAMED_ROLES = [
  `SELECT "role" AS "role" FROM "role_profiles"`,
  `SELECT "role" AS "role" FROM "role_access"`,
  `SELECT j."value" AS "role" FROM "tool_availability" a, ${ELEMENTS('a."subjects"')} j WHERE a."mode" = 'roles' AND j."type" = 'text'`,
  `SELECT j."value" AS "role" FROM "channel_access" a, ${ELEMENTS('a."subjects"')} j WHERE a."mode" = 'roles' AND j."type" = 'text'`,
];

// legacy (D-137): the one step that reads the roles of an install made before teams and permissions.
// Frozen like every migration: its SQL is a snapshot, it imports nothing (the built-in teams and the
// developer's permissions are written out), and `docs/spikes/teams-permissions.md` says what it does.
const teamsPermissions: BuildMigration = {
  name: "0042_teams_permissions",
  fingerprint: "teams-permissions-v1",
  // Not `destructive`: the platform's own deploy applies it without `--allow-destructive`, and every
  // value of a dropped column is copied first.
  destructive: false,
  up: [
    st(`ALTER TABLE "teams" ADD COLUMN "built_in" INTEGER NOT NULL DEFAULT 0`),
    st(`CREATE TABLE "team_permissions" (
  "workspace" TEXT NOT NULL,
  "team_id" TEXT NOT NULL,
  "permission" TEXT NOT NULL,
  PRIMARY KEY ("workspace", "team_id", "permission")
)`),
    // Every role name that is read below, and the team or subject it becomes: `admin` and `developer`
    // keep their name, `member` is everyone, `team-<id>` is the team `<id>`, any other role is a team
    // named by its slug. A slug that would read as a built-in team or as everyone, or be too short,
    // is changed (a role named `Admin` must not become the administrators); the team of the same
    // id, `team-admin`, does become the built-in one.
    st(
      `CREATE TABLE "_role_teams" ("role" TEXT PRIMARY KEY NOT NULL, "team" TEXT, "subject" TEXT NOT NULL)`,
    ),
    st(
      `CREATE TABLE "_held_roles" ("workspace" TEXT NOT NULL, "role" TEXT NOT NULL, PRIMARY KEY ("workspace", "role"))`,
    ),
    ...HELD_ROLES.map((select) =>
      st(`INSERT OR IGNORE INTO "_held_roles" ("workspace", "role") ${select}`),
    ),
    st(`INSERT OR IGNORE INTO "_role_teams" ("role", "team", "subject")
SELECT DISTINCT "role", NULL, '' FROM "_held_roles"`),
    ...NAMED_ROLES.map((select) =>
      st(
        `INSERT OR IGNORE INTO "_role_teams" ("role", "team", "subject") SELECT DISTINCT "role", NULL, '' FROM (${select})`,
      ),
    ),
    st(`UPDATE "_role_teams" SET "team" = CASE
  WHEN "role" = 'admin' THEN 'admin'
  WHEN "role" = 'developer' THEN 'developer'
  WHEN "role" = 'member' THEN NULL
  WHEN substr("role", 1, 5) = 'team-' THEN substr("role", 6)
  ELSE substr(lower(replace("role", '_', '-')), 1, 34)
END`),
    st(`UPDATE "_role_teams" SET "team" = "team" || '-team'
WHERE "team" = 'everyone' OR ("team" IN ('admin', 'developer') AND "role" NOT IN ('admin', 'developer') AND substr("role", 1, 5) <> 'team-')`),
    st(`UPDATE "_role_teams" SET "team" = "team" || '-' WHERE length("team") < 2`),
    st(
      `UPDATE "_role_teams" SET "subject" = CASE WHEN "team" IS NULL THEN 'everyone' ELSE 'team:' || "team" END`,
    ),

    st(`CREATE TABLE "_workspaces" ("workspace" TEXT PRIMARY KEY NOT NULL)`),
    ...WORKSPACE_SOURCES.map((table) =>
      st(`INSERT OR IGNORE INTO "_workspaces" ("workspace") SELECT "workspace" FROM "${table}"`),
    ),
    // The two built-in teams of every workspace; a team that already has the id becomes the built-in.
    st(`INSERT OR IGNORE INTO "teams" ("workspace", "id", "name", "description", "created_at", "built_in")
SELECT w."workspace", 'admin', 'Admins', 'Administer the workspace: every permission, now and to come.', strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), 1 FROM "_workspaces" w`),
    st(`INSERT OR IGNORE INTO "teams" ("workspace", "id", "name", "description", "created_at", "built_in")
SELECT w."workspace", 'developer', 'Developers', 'Build, deploy and publish the workspace''s tools.', strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), 1 FROM "_workspaces" w`),
    st(`UPDATE "teams" SET "built_in" = 1 WHERE "id" IN ('admin', 'developer')`),
    st(`INSERT OR IGNORE INTO "team_permissions" ("workspace", "team_id", "permission")
SELECT w."workspace", 'admin', '*' FROM "_workspaces" w`),
    st(`INSERT OR IGNORE INTO "team_permissions" ("workspace", "team_id", "permission")
SELECT w."workspace", 'developer', p."value" FROM "_workspaces" w,
  json_each('["tools:write","tools:publish","tools:data","access:read","marketplace:read"]') p`),

    // A team for every other role someone holds, is invited with, joins with by default, or is
    // given by a group of the identity provider; it is named like the role and has no permission.
    st(`INSERT OR IGNORE INTO "teams" ("workspace", "id", "name", "description", "created_at", "built_in")
SELECT held."workspace", rt."team", held."role", '', strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), 0
FROM "_held_roles" held
JOIN "_role_teams" rt ON rt."role" = held."role"
WHERE rt."team" IS NOT NULL AND substr(held."role", 1, 5) <> 'team-'
ORDER BY held."workspace", held."role"`),
    // People: the roles they held are teams they are in.
    st(`INSERT OR IGNORE INTO "team_members" ("workspace", "team_id", "member_id")
SELECT m."workspace", rt."team", m."id"
FROM "members" m, ${ELEMENTS('m."roles"')} j
JOIN "_role_teams" rt ON rt."role" = j."value"
JOIN "teams" t ON t."workspace" = m."workspace" AND t."id" = rt."team"
WHERE j."type" = 'text' AND rt."team" IS NOT NULL`),
    st(`ALTER TABLE "members" DROP COLUMN "roles"`),

    // Invitations, who joins by domain, and the groups of the identity providers.
    st(`ALTER TABLE "invitations" RENAME COLUMN "roles" TO "teams"`),
    st(`UPDATE "invitations" SET "teams" = (
  SELECT json_group_array("team") FROM (
    SELECT DISTINCT rt."team" AS "team" FROM ${ELEMENTS('"invitations"."teams"')} j
    JOIN "_role_teams" rt ON rt."role" = j."value" WHERE rt."team" IS NOT NULL ORDER BY rt."team"
  )
)`),
    st(`ALTER TABLE "membership_settings" RENAME COLUMN "default_role" TO "default_teams"`),
    st(`UPDATE "membership_settings" SET "default_teams" = COALESCE(
  (SELECT json_array(rt."team") FROM "_role_teams" rt WHERE rt."role" = "membership_settings"."default_teams" AND rt."team" IS NOT NULL),
  '[]'
)`),
    st(`ALTER TABLE "identity_providers" RENAME COLUMN "group_roles" TO "group_teams"`),
    st(`UPDATE "identity_providers" SET "group_teams" = (
  SELECT COALESCE(json_group_object(j."key", rt."team"), '{}')
  FROM json_each(CASE WHEN json_valid("identity_providers"."group_teams") THEN "identity_providers"."group_teams" ELSE '{}' END) j
  JOIN "_role_teams" rt ON rt."role" = j."value" WHERE rt."team" IS NOT NULL
)`),
    st(`ALTER TABLE "saml_providers" RENAME COLUMN "group_roles" TO "group_teams"`),
    st(`UPDATE "saml_providers" SET "group_teams" = (
  SELECT COALESCE(json_group_object(j."key", rt."team"), '{}')
  FROM json_each(CASE WHEN json_valid("saml_providers"."group_teams") THEN "saml_providers"."group_teams" ELSE '{}' END) j
  JOIN "_role_teams" rt ON rt."role" = j."value" WHERE rt."team" IS NOT NULL
)`),

    // What a tool gives: the rows are keyed by subject. Two roles that read as one team (`Sales` and
    // `sales`) leave one row, the other is dropped.
    st(`ALTER TABLE "role_profiles" RENAME TO "access_grants"`),
    st(`ALTER TABLE "access_grants" RENAME COLUMN "role" TO "subject"`),
    st(
      `UPDATE OR IGNORE "access_grants" SET "subject" = (SELECT rt."subject" FROM "_role_teams" rt WHERE rt."role" = "access_grants"."subject")`,
    ),
    st(`DELETE FROM "access_grants" WHERE "subject" <> 'everyone' AND "subject" NOT LIKE 'team:%'`),
    st(`ALTER TABLE "role_access" RENAME TO "access_exceptions"`),
    st(`ALTER TABLE "access_exceptions" RENAME COLUMN "role" TO "subject"`),
    st(
      `UPDATE OR IGNORE "access_exceptions" SET "subject" = (SELECT rt."subject" FROM "_role_teams" rt WHERE rt."role" = "access_exceptions"."subject")`,
    ),
    st(
      `DELETE FROM "access_exceptions" WHERE "subject" <> 'everyone' AND "subject" NOT LIKE 'team:%'`,
    ),

    // Who may add a tool or a channel: the mode `roles` is `teams`, and a list that names `member` is everyone.
    ...["tool_availability", "channel_access"].flatMap((table) => [
      st(`UPDATE "${table}" SET "mode" = 'everyone', "subjects" = '[]'
WHERE "mode" = 'roles' AND EXISTS (SELECT 1 FROM ${ELEMENTS(`"${table}"."subjects"`)} j WHERE j."value" = 'member')`),
      st(`UPDATE "${table}" SET "mode" = 'teams', "subjects" = (
  SELECT json_group_array("team") FROM (
    SELECT DISTINCT rt."team" AS "team" FROM ${ELEMENTS(`"${table}"."subjects"`)} j
    JOIN "_role_teams" rt ON rt."role" = j."value" WHERE rt."team" IS NOT NULL ORDER BY rt."team"
  )
) WHERE "mode" = 'roles'`),
    ]),

    // A stored build declares its profiles under `profiles`, as the manifest does from now on.
    st(`UPDATE "builds" SET "manifest" = json_remove(json_set("manifest", '$.profiles', json(json_extract("manifest", '$.roles'))), '$.roles')
WHERE json_valid("manifest") AND json_type("manifest", '$.roles') = 'object' AND json_type("manifest", '$.profiles') IS NULL`),
    st(`DROP TABLE "_role_teams"`),
    st(`DROP TABLE "_held_roles"`),
    st(`DROP TABLE "_workspaces"`),
  ],
  // One way: the roles are gone, and what a team holds cannot be told back into one.
  down: [],
};

// The migrations of the stores that are not modules yet (gateway code and assets, identity config,
// SAML): they keep their global numbers and move into a module when they get one.
/**
 * The registry's generation (D-146): one number, raised after every change made through the gateway, so that
 * what a Worker keeps in memory is checked against one small read instead of expiring after seconds.
 */
const registryGeneration: BuildMigration = {
  name: "0044_registry_generation",
  fingerprint: "registry-generation-v1",
  destructive: false,
  up: [
    st(`CREATE TABLE "registry_generation" (
  "id" INTEGER PRIMARY KEY NOT NULL CHECK ("id" = 1),
  "n" INTEGER NOT NULL
)`),
    st(`INSERT INTO "registry_generation" ("id", "n") VALUES (1, 0)`),
  ],
  down: [st(`DROP TABLE "registry_generation"`)],
};

export const rootMigrations: BuildMigration[] = [
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
  teamsPermissions,
  registryGeneration,
];
