import type { BuildMigration } from "@forgeron/hosting";
import { st } from "../../kernel/sql";

// Migrations owned by the teams module; the number is global (the order is the name, see ../../migrations.ts).
export const teamsMigrations: BuildMigration[] = [
  {
    // Teams (D-132): named groups of a workspace's members. Deleting a member leaves the team (cascade
    // is done by the store: `members` has a composite key).
    name: "0039_teams",
    fingerprint: "teams-v1",
    destructive: false,
    up: [
      st(`CREATE TABLE "teams" (
  "workspace" TEXT NOT NULL,
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL DEFAULT '',
  "created_at" TEXT NOT NULL,
  PRIMARY KEY ("workspace", "id")
)`),
      st(`CREATE TABLE "team_members" (
  "workspace" TEXT NOT NULL,
  "team_id" TEXT NOT NULL,
  "member_id" TEXT NOT NULL,
  PRIMARY KEY ("workspace", "team_id", "member_id")
)`),
      st(`CREATE INDEX "team_members_member" ON "team_members" ("workspace", "member_id")`),
    ],
    down: [st(`DROP TABLE "team_members"`), st(`DROP TABLE "teams"`)],
  },
];
