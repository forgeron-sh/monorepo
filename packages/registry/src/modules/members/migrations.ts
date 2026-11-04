import type { BuildMigration } from "@forgeron/hosting";
import { st } from "../../kernel/sql";

// Migrations owned by the members module; the number is global (the order is the name, see ../../migrations.ts).
export const membersMigrations: BuildMigration[] = [
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
];
