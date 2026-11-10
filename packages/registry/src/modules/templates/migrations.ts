import type { BuildMigration } from "@forgeron/hosting";
import { st } from "../../kernel/sql";

// Migrations owned by the templates module; the number is global (the order is the name, see ../../migrations.ts).
export const templatesMigrations: BuildMigration[] = [
  {
    // Install plans (D-092): the plan an admin reads before a tool is created from a template. It is
    // bound to the person and the workspace, names the version it showed, lives 15 minutes and is
    // spent once. `claim` is set by the statement that spends it.
    name: "0024_install_plans",
    fingerprint: "install-plans-v1",
    destructive: false,
    up: [
      st(`CREATE TABLE "install_plans" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "workspace" TEXT NOT NULL,
  "template" TEXT NOT NULL,
  "version" TEXT NOT NULL,
  "person" TEXT NOT NULL,
  "created_at" TEXT NOT NULL,
  "expires_at" TEXT NOT NULL,
  "used_at" TEXT,
  "claim" TEXT
)`),
    ],
    down: [st(`DROP TABLE "install_plans"`)],
  },
  {
    // The catalogue a plan installs from (D-116): `@templates`, or a marketplace's `@mp:<id>`.
    name: "0030_install_plans_source",
    fingerprint: "install-plans-source-v1",
    destructive: false,
    up: [st(`ALTER TABLE "install_plans" ADD COLUMN "source" TEXT NOT NULL DEFAULT '@templates'`)],
    down: [st(`ALTER TABLE "install_plans" DROP COLUMN "source"`)],
  },
  {
    // Where a tool comes from (D-121): a marketplace (`@templates` or `@mp:<id>`, and the tool's
    // name there), or a GitHub repository whose CI deploys it (`repo`). Which branch's preview is the
    // candidate for production, and whether a new version goes there by itself. A tool with no row
    // was deployed before sources: it behaves as a repository on `main`, updated by hand.
    name: "0033_tool_sources",
    fingerprint: "tool-sources-v1",
    destructive: false,
    up: [
      st(`CREATE TABLE "tool_sources" (
  "tool_id" TEXT PRIMARY KEY NOT NULL REFERENCES "tools" ("id") ON DELETE CASCADE,
  "kind" TEXT NOT NULL,
  "source" TEXT,
  "source_tool" TEXT,
  "repo" TEXT,
  "production_branch" TEXT NOT NULL DEFAULT 'main',
  "auto_update" INTEGER NOT NULL DEFAULT 0,
  "updated_by" TEXT NOT NULL,
  "updated_at" TEXT NOT NULL
)`),
    ],
    down: [st(`DROP TABLE "tool_sources"`)],
  },
];
