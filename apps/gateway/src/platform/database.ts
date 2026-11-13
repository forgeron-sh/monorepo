import {
  dbEnvironmentsRoute,
  dbExportRoute,
  dbRowsRoute,
  dbSchemaRoute,
  dbTableRoute,
  dbTablesRoute,
} from "@forgeron/platform-contract";
import type { OpenAPIHono } from "@hono/zod-openapi";
import type { Context } from "hono";
import { handleDatabase } from "../console-api/database/index";
import type { PlatformEnv } from "./app";

// The database explorer (D-059, docs/console-ux.md), read only, for who holds `tools:data`. The routes
// are in the contract and in the OpenAPI document; the explorer's own checks stay in `handleDatabase`
// because their order is part of what it promises: it looks the tool up first and writes a `denied`
// audit line before it answers 403, so a refusal is on the record, and its answers carry a message
// the console shows. Every method reaches it: anything but GET is its 405 ("The database is read
// only."), and a CSV leaves as the `Response` it builds.

const serve = async (c: Context<PlatformEnv>) =>
  (await handleDatabase(c.req.raw, {
    registry: c.env.registry,
    workspace: c.env.workspace,
    hosting: c.env.hosting,
    caller: async () => c.env.identity(),
    ...(c.env.databaseTimeoutMs ? { timeoutMs: c.env.databaseTimeoutMs } : {}),
  })) ?? c.notFound();

export function mountDatabase(app: OpenAPIHono<PlatformEnv>): void {
  for (const route of [
    dbEnvironmentsRoute,
    dbTablesRoute,
    dbSchemaRoute,
    dbTableRoute,
    dbRowsRoute,
    dbExportRoute,
  ]) {
    // `{x}` of the document is `:x` of Hono; the route is not an `app.openapi` one (see above).
    app.openAPIRegistry.registerPath(route);
    app.all(route.path.replaceAll(/\{(\w+)\}/g, ":$1"), serve);
  }
}
