import type { BuildMigration } from "@forgeron/hosting";
import { st } from "../../kernel/sql";

// Migrations owned by the github module; the number is global (the order is the name, see ../../migrations.ts).
export const githubMigrations: BuildMigration[] = [
  {
    // The GitHub App of a workspace (D-123): one per workspace, made from the console. Its private
    // key, webhook secret and client secret are sealed together under `github-app/<workspace>`. Its
    // installations say on which organisations or accounts it may act.
    name: "0035_github",
    fingerprint: "github-v1",
    destructive: false,
    up: [
      st(`CREATE TABLE "github_apps" (
  "workspace" TEXT PRIMARY KEY NOT NULL,
  "app_id" INTEGER NOT NULL,
  "slug" TEXT NOT NULL,
  "client_id" TEXT NOT NULL,
  "owner" TEXT NOT NULL,
  "html_url" TEXT NOT NULL,
  "iv" TEXT NOT NULL,
  "ciphertext" TEXT NOT NULL,
  "created_by" TEXT NOT NULL,
  "created_at" TEXT NOT NULL
)`),
      st(`CREATE TABLE "github_installations" (
  "workspace" TEXT NOT NULL,
  "installation_id" INTEGER NOT NULL,
  "account" TEXT NOT NULL,
  "account_type" TEXT NOT NULL,
  "created_at" TEXT NOT NULL,
  PRIMARY KEY ("workspace", "installation_id")
)`),
    ],
    down: [st(`DROP TABLE "github_installations"`), st(`DROP TABLE "github_apps"`)],
  },
];
