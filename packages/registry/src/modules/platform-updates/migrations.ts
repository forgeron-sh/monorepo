import type { BuildMigration } from "@forgeron/hosting";
import { st } from "../../kernel/sql";

// Migrations owned by the platform-updates module; the number is global (the order is the name, see ../../migrations.ts).
export const platformUpdatesMigrations: BuildMigration[] = [
  {
    // The platform updating itself from the console (D-138): one row per attempt, its steps as JSON
    // and the Time Travel bookmark taken before anything changed. The platform is shared by its
    // workspaces: no workspace column. The partial unique index is "one update at a time": a second
    // `running` row cannot be inserted.
    name: "0043_platform_updates",
    fingerprint: "platform-updates-v1",
    destructive: false,
    up: [
      st(`CREATE TABLE "platform_updates" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "from_version" TEXT NOT NULL,
  "to_version" TEXT NOT NULL,
  "state" TEXT NOT NULL CHECK ("state" IN ('running', 'succeeded', 'failed')),
  "steps" TEXT NOT NULL,
  "bookmark" TEXT,
  "actor" TEXT NOT NULL,
  "started_at" TEXT NOT NULL,
  "finished_at" TEXT,
  "error" TEXT
)`),
      st(
        `CREATE UNIQUE INDEX "platform_updates_one_running" ON "platform_updates" ("state") WHERE "state" = 'running'`,
      ),
      st(`CREATE INDEX "platform_updates_by_start" ON "platform_updates" ("started_at")`),
    ],
    down: [st(`DROP TABLE "platform_updates"`)],
  },
];
