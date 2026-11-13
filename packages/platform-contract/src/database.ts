import { z } from "zod";
import { ErrorSchema } from "./error";
import { defineRoute } from "./route";

// The database explorer of the console, read only (docs/console-ux.md, D-059), for admins and
// developers. The environment is `?env=production` or `?env=preview&branch=<ref>` and must be one the
// registry knows: `<ref>` is a channel's reference, a branch or `~<name>` for a permanent channel
// other than production (D-125). Every access is written to the audit log before data is sent.
//
// The table definitions are described loosely (`looseObject`: the explorer adds fields as the schema
// reader learns them); the errors are `{ error, message }` with the explorer's own codes.

const json = <T extends z.ZodType>(schema: T, description: string) => ({
  description,
  content: { "application/json": { schema } },
});
const tool = z.string().describe("The tool's name");
const table = z.string().describe("The table's name, URL-encoded");
const environmentQuery = {
  env: z.string().optional().describe("`production` (default) or `preview`"),
  branch: z
    .string()
    .optional()
    .describe("A channel other than production: a branch, or `~<name>` for a permanent one"),
  platform: z.string().optional().describe("`1` shows the platform's own tables"),
  reveal: z.string().optional().describe("`1` shows masked columns (admins only)"),
};
const errors = {
  400: json(ErrorSchema, "The query is refused (`error` is its code)"),
  401: json(ErrorSchema, "Not signed in"),
  403: json(ErrorSchema, "Lacks the permission"),
  404: json(ErrorSchema, "No such tool, environment, database or table"),
  501: json(ErrorSchema, "This install cannot read tool databases"),
  502: json(ErrorSchema, "The database could not be read, or the audit line could not be written"),
  504: json(ErrorSchema, "The database took too long to answer"),
};

const column = z.looseObject({
  name: z.string(),
  kind: z.string(),
  masked: z.enum(["tagged", "name"]).nullable().optional(),
  operators: z.array(z.string()).optional(),
  foreignKey: z.unknown().optional(),
});
const definition = z.looseObject({
  name: z.string(),
  rows: z.number().int().optional(),
  columns: z.array(column),
});
const cell = z.union([
  z.string(),
  z.number(),
  z.null(),
  z.strictObject({ masked: z.enum(["tagged", "name"]) }),
]);

export const dbEnvironmentsRoute = defineRoute({
  method: "get",
  path: "/api/tools/{tool}/db/environments",
  summary: "The environments of the tool that have a version",
  tags: ["database"],
  request: { params: z.object({ tool }) },
  responses: {
    200: json(
      z.strictObject({
        environments: z.array(
          z.strictObject({
            name: z.enum(["production", "preview"]),
            branch: z.string().optional(),
          }),
        ),
      }),
      "The environments",
    ),
    ...errors,
  },
});

export const dbTablesRoute = defineRoute({
  method: "get",
  path: "/api/tools/{tool}/db/tables",
  summary: "The tool's tables with their row and column counts",
  tags: ["database"],
  request: { params: z.object({ tool }), query: z.object(environmentQuery) },
  responses: {
    200: json(
      z.strictObject({
        tables: z.array(
          z.strictObject({ name: z.string(), rows: z.number().int(), columns: z.number().int() }),
        ),
      }),
      "The tables",
    ),
    ...errors,
  },
});

export const dbSchemaRoute = defineRoute({
  method: "get",
  path: "/api/tools/{tool}/db/schema",
  summary: "Every table's definition with its row count: tables and relations",
  tags: ["database"],
  request: { params: z.object({ tool }), query: z.object(environmentQuery) },
  responses: {
    200: json(z.strictObject({ tables: z.array(definition) }), "The definitions"),
    ...errors,
  },
});

export const dbTableRoute = defineRoute({
  method: "get",
  path: "/api/tools/{tool}/db/tables/{table}",
  summary: "One table's definition (the Definition view)",
  tags: ["database"],
  request: { params: z.object({ tool, table }), query: z.object(environmentQuery) },
  responses: { 200: json(z.strictObject({ table: definition }), "The definition"), ...errors },
});

export const dbRowsRoute = defineRoute({
  method: "get",
  path: "/api/tools/{tool}/db/tables/{table}/rows",
  summary: "A page of rows, sorted and filtered",
  tags: ["database"],
  request: {
    params: z.object({ tool, table }),
    query: z.object({
      ...environmentQuery,
      page: z.string().optional().describe("A whole number, 1 or more"),
      limit: z.string().optional().describe("A page's size, at most 100"),
      sort: z.string().optional().describe("A column"),
      dir: z.string().optional().describe("`asc` or `desc`"),
      filter: z.string().optional().describe("A JSON list of { column, op, value }"),
    }),
  },
  responses: {
    200: json(
      z.strictObject({
        columns: z.array(column),
        /** One cell per column; a masked column is `{ masked }`. */
        rows: z.array(z.array(cell)),
        total: z.number().int().nullable().optional(),
        page: z.number().int(),
        pageSize: z.number().int(),
        hasMore: z.boolean(),
        offsetCap: z.number().int(),
      }),
      "The rows",
    ),
    ...errors,
  },
});

export const dbExportRoute = defineRoute({
  method: "get",
  path: "/api/tools/{tool}/db/tables/{table}/export",
  summary: "The rows as CSV, at most the export cap (`x-forgeron-truncated` says when it cut)",
  tags: ["database"],
  request: {
    params: z.object({ tool, table }),
    query: z.object({
      ...environmentQuery,
      sort: z.string().optional(),
      dir: z.string().optional(),
      filter: z.string().optional(),
    }),
  },
  responses: {
    200: {
      description: "The CSV, as an attachment",
      content: { "text/csv": { schema: z.string() } },
    },
    ...errors,
  },
});
