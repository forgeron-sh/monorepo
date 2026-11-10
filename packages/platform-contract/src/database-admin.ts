import { z } from "zod";
import { ErrorSchema } from "./error";
import { defineRoute } from "./route";

// Operations on a tool's remote database, for admins (D-113): what the environment's migrations are, and
// one SQL statement run on it, in the manner of `wrangler d1 execute`. They are what `forgeron db status`
// and `forgeron db shell` call with `--env preview|production`. Not the explorer (read only, masked
// columns, developers too): arbitrary SQL cannot honour a masked column, so these are admins only, and
// every statement is audited before it runs.

const json = <T extends z.ZodType>(schema: T, description: string) => ({
  description,
  content: { "application/json": { schema } },
});
const tool = z.string().describe("The tool's name");

export const MAX_SQL = 10_000;
export const MAX_QUERY_ROWS = 1000;

export const dbMigrationsRoute = defineRoute({
  method: "get",
  path: "/api/tools/{tool}/db/migrations",
  summary: "The migrations of an environment's database against the version it serves",
  tags: ["database"],
  request: {
    params: z.object({ tool }),
    query: z.object({
      env: z.string().optional().describe("`production` (default) or `preview`"),
      branch: z.string().optional().describe("The preview's branch"),
    }),
  },
  responses: {
    200: json(
      z.strictObject({
        environment: z.string(),
        branch: z.string().optional(),
        version: z.string().optional().describe("The version the environment serves"),
        applied: z.array(z.string()),
        pending: z.array(z.string()),
        destructive: z.array(z.string()),
        conflicts: z.array(
          z.strictObject({ code: z.string(), migration: z.string(), message: z.string() }),
        ),
      }),
      "What is applied, what is pending, and what the version and the database disagree on",
    ),
    401: json(ErrorSchema, "Not signed in"),
    403: json(ErrorSchema, "Not an admin"),
    404: json(ErrorSchema, "No such tool, environment, version or database"),
    501: json(ErrorSchema, "This install cannot reach tool databases"),
    502: json(ErrorSchema, "The database could not be read"),
    504: json(ErrorSchema, "The database took too long to answer"),
  },
});

export const dbQueryRoute = defineRoute({
  method: "post",
  path: "/api/tools/{tool}/db/query",
  summary: "Run one SQL statement on an environment's database",
  description:
    "A statement that reads runs as it is. One that writes needs `write: true`, and on production `confirm` set to the tool's name. The statement is audited before it runs: its text for a write, its hash for a read.",
  tags: ["database"],
  request: {
    params: z.object({ tool }),
    body: {
      required: true,
      content: {
        "application/json": {
          schema: z.object({
            sql: z.string().min(1).max(MAX_SQL),
            env: z.enum(["preview", "production"]).optional(),
            branch: z.string().optional().describe("Required for a preview"),
            write: z.boolean().optional(),
            confirm: z.string().optional().describe("The tool's name, to write on production"),
          }),
        },
      },
    },
  },
  responses: {
    200: json(
      z.strictObject({
        write: z.boolean(),
        rows: z.array(z.record(z.string(), z.unknown())),
        rowCount: z.number().int(),
        truncated: z.boolean().describe(`More than ${MAX_QUERY_ROWS} rows: the rest is dropped`),
      }),
      "The rows the statement returned",
    ),
    400: json(ErrorSchema, "Not one statement, or the body is not valid"),
    401: json(ErrorSchema, "Not signed in"),
    403: json(ErrorSchema, "Not an admin"),
    404: json(ErrorSchema, "No such tool, environment or database"),
    409: json(ErrorSchema, "A write on production needs `confirm` (`CONFIRM_REQUIRED`)"),
    422: json(ErrorSchema, "The statement writes and `write` was not set (`WRITE_REQUIRED`)"),
    501: json(ErrorSchema, "This install cannot reach tool databases"),
    502: json(ErrorSchema, "The statement failed, or the audit line could not be written"),
    504: json(ErrorSchema, "The database took too long to answer"),
  },
});
