import type { z } from "zod";

// A route of the platform API as plain data: the gateway serves it (`createRoute` of
// `@hono/zod-openapi` takes it as is), the console and the CLI call it through `createClient`, and
// the OpenAPI document comes from it. This package imports no HTTP library, so a client never
// bundles one.

type JsonContent = { "application/json": { schema: z.ZodType } };

export interface ResponseSpec {
  description: string;
  content?: JsonContent;
}

export interface RouteSpec {
  method: "get" | "post" | "put" | "patch" | "delete";
  /** OpenAPI style: `/api/members/{id}`. */
  path: string;
  summary?: string;
  tags?: string[];
  request?: {
    params?: z.ZodObject;
    query?: z.ZodObject;
    body?: { content: JsonContent; required?: boolean };
  };
  /** Every answer the route gives, by status: the handler and the client are both checked against it. */
  responses: { [status: number]: ResponseSpec };
  /** OpenAPI extensions (`x-…`), as `RouteConfig` has them. */
  [extension: `x-${string}`]: unknown;
}

/** Keeps the literal type of a route (its statuses and schemas), which the client reads. */
export const defineRoute = <const R extends RouteSpec>(route: R): R => route;
