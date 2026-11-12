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
  {
    // D-127: what each workspace role is given in a tool. A row maps a role to all the permissions,
    // a profile of the tool, a custom set of permissions, or none. The existing data keeps working:
    // a workspace role named like a role of the tool (now a profile) is mapped to that profile, which
    // covers every role of `role_access` (only a role of the tool could be set there); then `admin`
    // gets all and `member` the default profile where no row says otherwise. The manifest read is the
    // one the matrix reads: production's version, else the latest published.
    name: "0038_tool_profiles",
    fingerprint: "tool-profiles-v1",
    destructive: false,
    up: [
      st(`CREATE TABLE "role_profiles" (
  "tool_id" TEXT NOT NULL REFERENCES "tools" ("id") ON DELETE CASCADE,
  "role" TEXT NOT NULL,
  "kind" TEXT NOT NULL CHECK ("kind" IN ('all', 'profile', 'custom', 'none')),
  "profile" TEXT,
  "permissions" TEXT,
  "updated_by" TEXT NOT NULL,
  "updated_at" TEXT NOT NULL,
  PRIMARY KEY ("tool_id", "role")
)`),
      st(`WITH "current" AS (
  SELECT t."id" AS "tool_id", b."manifest" AS "manifest"
  FROM "tools" t
  JOIN "builds" b ON b."id" = COALESCE(
    (SELECT v."build_id" FROM "environments" e JOIN "versions" v ON v."id" = e."version_id" WHERE e."tool_id" = t."id" AND e."name" = 'production'),
    (SELECT v."build_id" FROM "versions" v WHERE v."tool_id" = t."id" ORDER BY v."created_at" DESC, v."rowid" DESC LIMIT 1)
  )
  WHERE json_valid(b."manifest")
)
INSERT OR IGNORE INTO "role_profiles" ("tool_id", "role", "kind", "profile", "permissions", "updated_by", "updated_at")
SELECT c."tool_id", r."key", 'profile', r."key", NULL, 'forgeron', strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
FROM "current" c, json_each(c."manifest", '$.roles') r`),
      st(`INSERT OR IGNORE INTO "role_profiles" ("tool_id", "role", "kind", "profile", "permissions", "updated_by", "updated_at")
SELECT DISTINCT a."tool_id", a."role", 'profile', a."role", NULL, 'forgeron', strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
FROM "role_access" a`),
      st(`WITH "current" AS (
  SELECT t."id" AS "tool_id", b."manifest" AS "manifest"
  FROM "tools" t
  JOIN "builds" b ON b."id" = COALESCE(
    (SELECT v."build_id" FROM "environments" e JOIN "versions" v ON v."id" = e."version_id" WHERE e."tool_id" = t."id" AND e."name" = 'production'),
    (SELECT v."build_id" FROM "versions" v WHERE v."tool_id" = t."id" ORDER BY v."created_at" DESC, v."rowid" DESC LIMIT 1)
  )
  WHERE json_valid(b."manifest")
)
INSERT OR IGNORE INTO "role_profiles" ("tool_id", "role", "kind", "profile", "permissions", "updated_by", "updated_at")
SELECT c."tool_id", 'admin', 'all', NULL, NULL, 'forgeron', strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
FROM "current" c`),
      st(`WITH "current" AS (
  SELECT t."id" AS "tool_id", b."manifest" AS "manifest"
  FROM "tools" t
  JOIN "builds" b ON b."id" = COALESCE(
    (SELECT v."build_id" FROM "environments" e JOIN "versions" v ON v."id" = e."version_id" WHERE e."tool_id" = t."id" AND e."name" = 'production'),
    (SELECT v."build_id" FROM "versions" v WHERE v."tool_id" = t."id" ORDER BY v."created_at" DESC, v."rowid" DESC LIMIT 1)
  )
  WHERE json_valid(b."manifest")
)
INSERT OR IGNORE INTO "role_profiles" ("tool_id", "role", "kind", "profile", "permissions", "updated_by", "updated_at")
SELECT c."tool_id", 'member', 'profile', (
  SELECT r."key" FROM json_each(c."manifest", '$.roles') r
  ORDER BY CASE WHEN json_extract(r."value", '$.default') = 1 THEN 0 ELSE 1 END, json_array_length(r."value", '$.grants'), r."id"
  LIMIT 1
), NULL, 'forgeron', strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
FROM "current" c
WHERE EXISTS (SELECT 1 FROM json_each(c."manifest", '$.roles'))`),
    ],
    down: [st(`DROP TABLE "role_profiles"`)],
  },
];
