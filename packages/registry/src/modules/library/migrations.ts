import type { BuildMigration } from "@forgeron/hosting";
import { st } from "../../kernel/sql";

// Migrations owned by the library module; the number is global (the order is the name, see ../../migrations.ts).
export const libraryMigrations: BuildMigration[] = [
  {
    // Who may install a tool, and who did (D-117). A tool with no row in `tool_availability` is open
    // as before; one installed from a catalogue starts at `nobody`. `person_tools` is a person's
    // library: a tool with a rule is only reached by the people who have it there.
    name: "0031_library",
    fingerprint: "library-v1",
    destructive: false,
    up: [
      st(`CREATE TABLE "tool_availability" (
  "tool_id" TEXT PRIMARY KEY NOT NULL REFERENCES "tools" ("id") ON DELETE CASCADE,
  "mode" TEXT NOT NULL,
  "subjects" TEXT NOT NULL DEFAULT '[]',
  "updated_by" TEXT,
  "updated_at" TEXT NOT NULL
)`),
      st(`CREATE TABLE "person_tools" (
  "tool_id" TEXT NOT NULL REFERENCES "tools" ("id") ON DELETE CASCADE,
  "person" TEXT NOT NULL,
  "installed_at" TEXT NOT NULL,
  PRIMARY KEY ("tool_id", "person")
)`),
    ],
    down: [st(`DROP TABLE "person_tools"`), st(`DROP TABLE "tool_availability"`)],
  },
];
