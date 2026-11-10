import { dbMigrationsRoute, dbQueryRoute, MAX_QUERY_ROWS } from "@forgeron/platform-contract";
import { checkMigrations, type BuildMigration, type D1Database } from "@forgeron/hosting";
import type { OpenAPIHono } from "@hono/zod-openapi";
import { methodNotAllowed, platformRoute, type PlatformEnv } from "./app";

// Operations on a tool's remote database (D-113), for admins: the migrations of an environment against the
// version it serves, and one SQL statement run on it. The browser never names a database: the environment
// must be one the registry knows, and the gateway reaches it through the hosting layer. Every statement is
// audited BEFORE it runs, and a statement that cannot be audited is not run.

const STATEMENT_TIMEOUT_MS = 10_000;
const FORBIDDEN = "The database operations are for admins.";
const note = (code: string, message: string) => ({ error: code, message });

/** Statements that read. Anything else is a write, and takes `write: true`. */
const READS = /^\s*(select|explain|pragma\s+table_info|pragma\s+index_list|with)\b/i;
/** A statement that starts like a read can still write (`WITH x AS (...) DELETE ...`): look inside. */
const WRITES_INSIDE =
  /\b(insert|update|delete|replace|drop|create|alter|attach|detach|vacuum|reindex)\b/i;

/** One statement only: a `;` that is not the last character is refused (a `;` in a string is too, on purpose). */
export function singleStatement(sql: string): string | undefined {
  const text = sql.trim().replace(/;\s*$/, "");
  return text === "" || text.includes(";") ? undefined : text;
}

export function writes(sql: string): boolean {
  return !READS.test(sql) || (/^\s*with\b/i.test(sql) && WRITES_INSIDE.test(sql));
}

async function sha256(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  return [...digest].map((b) => b.toString(16).padStart(2, "0")).join("");
}

class Timeout extends Error {}
function within<T>(work: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const clock = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Timeout()), ms);
  });
  return Promise.race([work, clock]).finally(() => clearTimeout(timer));
}

export function mountDatabaseAdmin(app: OpenAPIHono<PlatformEnv>): void {
  /** The environment a request names, the way the explorer finds it: one the registry knows. */
  async function target(
    c: { env: PlatformEnv["Bindings"] },
    toolName: string,
    name: string,
    branch: string | undefined,
  ) {
    const { registry, workspace } = c.env;
    const tool = await registry.findTool(workspace, toolName);
    if (!tool)
      return { status: 404 as const, body: note("NOT_FOUND", `There is no tool ${toolName}.`) };
    const environment = (await registry.listEnvironments(tool.id)).find(
      (e) => e.name === name && (e.name === "production" ? !branch : e.branch === branch),
    );
    if (!environment) {
      return { status: 404 as const, body: note("NOT_FOUND", "There is no such environment.") };
    }
    const hosting = c.env.hosting(workspace);
    if (!hosting?.openDatabase) {
      return {
        status: 501 as const,
        body: note("NOT_AVAILABLE", "This install cannot reach tool databases."),
      };
    }
    return { tool, environment, hosting };
  }

  app.openapi(platformRoute(dbMigrationsRoute, "admin", FORBIDDEN), async (c) => {
    const { tool: toolName } = c.req.valid("param");
    const { env = "production", branch } = c.req.valid("query");
    const found = await target(c, toolName, env, branch);
    if ("status" in found) return c.json(found.body, found.status);
    const { tool, environment, hosting } = found;
    const { registry } = c.env;
    const version = environment.versionId
      ? await registry.getVersion(environment.versionId)
      : undefined;
    const build = version ? await registry.getBuild(version.buildId) : undefined;
    if (!version || !build) {
      return c.json(note("NOT_FOUND", "This environment serves no version yet."), 404);
    }
    try {
      const db = await within(
        hosting.openDatabase!({
          tool: tool.name,
          name: environment.name,
          ...(environment.branch ? { branch: environment.branch } : {}),
        }),
        c.env.databaseTimeoutMs ?? STATEMENT_TIMEOUT_MS,
      );
      if (!db)
        return c.json(note("NO_DATABASE", "This tool has no database in this environment."), 404);
      const migrations = (
        Array.isArray(build.migrations) ? build.migrations : []
      ) as BuildMigration[];
      const check = await within(
        checkMigrations(db, migrations),
        c.env.databaseTimeoutMs ?? STATEMENT_TIMEOUT_MS,
      );
      return c.json(
        {
          environment: environment.name,
          ...(environment.branch ? { branch: environment.branch } : {}),
          version: version.version,
          ...check,
        },
        200,
      );
    } catch (error) {
      if (error instanceof Timeout) {
        return c.json(note("TIMEOUT", "The database took too long to answer."), 504);
      }
      return c.json(note("UPSTREAM", "The database could not be read."), 502);
    }
  });

  app.openapi(platformRoute(dbQueryRoute, "admin", FORBIDDEN), async (c) => {
    const { tool: toolName } = c.req.valid("param");
    const body = c.req.valid("json");
    const env = body.env ?? "production";
    if (env === "preview" && !body.branch) {
      return c.json(note("INVALID", "A preview is tied to a branch: pass `branch`."), 400);
    }
    const statement = singleStatement(body.sql);
    if (statement === undefined) {
      return c.json(note("INVALID", "Give exactly one statement."), 400);
    }
    const found = await target(c, toolName, env, body.branch);
    if ("status" in found) return c.json(found.body, found.status);
    const { tool, environment, hosting } = found;
    const writing = writes(statement);
    if (writing && body.write !== true) {
      return c.json(
        note("WRITE_REQUIRED", "This statement writes: it needs `write: true` (`--write`)."),
        422,
      );
    }
    if (writing && environment.name === "production" && body.confirm !== tool.name) {
      return c.json(
        note(
          "CONFIRM_REQUIRED",
          `A write on production needs \`confirm\` set to the tool's name ("${tool.name}").`,
        ),
        409,
      );
    }
    const where = {
      environment: environment.name,
      ...(environment.branch ? { branch: environment.branch } : {}),
    };
    const actor = c.get("person").id;
    // The record comes first: a statement that cannot be recorded is not run. A write keeps its text (an
    // admin answers for it, up to 1,000 characters); a read keeps only a hash and a length (the values in
    // its text could be anyone's).
    try {
      await c.env.registry.recordAudit({
        toolId: tool.id,
        actor,
        interface: "api",
        ...(c.env.via ? { via: c.env.via } : {}),
        kind: "access",
        subject: writing ? "db:write" : "db:query",
        detail: {
          ...where,
          length: statement.length,
          ...(writing
            ? { statement: statement.slice(0, 1000), truncated: statement.length > 1000 }
            : { sha256: await sha256(statement) }),
        },
      });
    } catch {
      return c.json(
        note("AUDIT_FAILED", "The statement was not run: it could not be recorded."),
        502,
      );
    }
    const timeoutMs = c.env.databaseTimeoutMs ?? STATEMENT_TIMEOUT_MS;
    try {
      const db: D1Database | undefined = await within(
        hosting.openDatabase!({
          tool: tool.name,
          name: environment.name,
          ...(environment.branch ? { branch: environment.branch } : {}),
        }),
        timeoutMs,
      );
      if (!db)
        return c.json(note("NO_DATABASE", "This tool has no database in this environment."), 404);
      const result = await within(db.prepare(statement).all(), timeoutMs);
      const rows = (result.results ?? []) as Array<Record<string, unknown>>;
      return c.json(
        {
          write: writing,
          rows: rows.slice(0, MAX_QUERY_ROWS),
          rowCount: rows.length,
          truncated: rows.length > MAX_QUERY_ROWS,
        },
        200,
      );
    } catch (error) {
      const timedOut = error instanceof Timeout;
      await c.env.registry
        .recordAudit({
          toolId: tool.id,
          actor,
          interface: "api",
          kind: "access",
          subject: writing ? "db:write" : "db:query",
          result: "error",
          detail: { ...where, reason: timedOut ? "timeout" : "failed" },
        })
        .catch(() => undefined);
      if (timedOut) return c.json(note("TIMEOUT", "The database took too long to answer."), 504);
      // The database's own message is the person's to read: it names the table or the column.
      const message = error instanceof Error ? error.message : String(error);
      return c.json(note("STATEMENT_FAILED", message.slice(0, 500)), 502);
    }
  });

  app.on(
    ["POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    "/api/tools/:tool/db/migrations",
    methodNotAllowed,
  );
  app.on(
    ["GET", "PUT", "PATCH", "DELETE", "OPTIONS"],
    "/api/tools/:tool/db/query",
    methodNotAllowed,
  );
}
