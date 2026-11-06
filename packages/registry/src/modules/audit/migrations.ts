import type { BuildMigration } from "@forgeron/hosting";
import { st } from "../../kernel/sql";

// Migrations owned by the audit module; the number is global (the order is the name, see ../../migrations.ts).
export const auditMigrations: BuildMigration[] = [
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
    // Installing a template (D-081) is audited: `install` joins the kinds. Rebuilt as in 0014.
    name: "0022_audit_install",
    fingerprint: "audit-install-v1",
    destructive: false,
    up: [
      st(`CREATE TABLE "audit_log_next" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "at" TEXT NOT NULL,
  "tool_id" TEXT,
  "actor" TEXT NOT NULL,
  "interface" TEXT,
  "via" TEXT,
  "kind" TEXT NOT NULL CHECK ("kind" IN ('action', 'deployment', 'promotion', 'rollback', 'approval', 'access', 'install')),
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
];
