import type { BuildMigration } from "@forgeron/hosting";
import { st } from "../../kernel/sql";

// Migrations owned by the usage module; the number is global (the order is the name, see ../../migrations.ts).
export const usageMigrations: BuildMigration[] = [
  {
    // Usage (D-093): authenticated calls that reached a tool, counted per workspace, tool, person
    // and UTC day. Names, not ids: a tool that is deleted keeps its past usage. No payload, no path.
    name: "0025_usage_daily",
    fingerprint: "usage-daily-v1",
    destructive: false,
    up: [
      st(`CREATE TABLE "usage_daily" (
  "workspace" TEXT NOT NULL,
  "tool" TEXT NOT NULL,
  "person_id" TEXT NOT NULL,
  "day" TEXT NOT NULL,
  "calls" INTEGER NOT NULL,
  PRIMARY KEY ("workspace", "tool", "person_id", "day")
)`),
      st(`CREATE INDEX "usage_daily_by_day" ON "usage_daily" ("workspace", "day")`),
    ],
    down: [st(`DROP TABLE "usage_daily"`)],
  },
];
