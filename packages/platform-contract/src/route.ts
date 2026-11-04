import type { z } from "zod";

// A route of the platform API as plain data: the gateway serves it (`createRoute` of
// `@hono/zod-openapi` takes it as is), the console and the CLI call it through `createClient`, and
// the OpenAPI document comes from it. This package imports no HTTP library, so a client never
// bundles one.

type JsonContent = { "application/json": { schema: z.ZodType } };

/**
 * An answer: JSON, or another media type (an image). `createClient` reads JSON only; a route with
 * another media type is for the browser (an `<img>` address), and its client body is `undefined`.
 */
export interface ResponseSpec {
  description: string;
  content?: { [mediaType: string]: { schema: z.ZodType } };
}

export interface RouteSpec {
  method: "get" | "post" | "put" | "patch" | "delete";
  /** OpenAPI style: `/api/members/{id}`. */
  path: string;
  summary?: string;
  description?: string;
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

declare const routeType: unique symbol;

/**
 * What the client needs of a route at run time: its method and path. The route's type rides along
 * (never present at run time), so the client types the call and the answer from it. A browser can
 * hold an `Address` and import the route as a type only, and so bundle none of its schemas.
 */
export type Address<R extends RouteSpec = RouteSpec> = {
  method: R["method"];
  path: R["path"];
  readonly [routeType]?: R;
};

/**
 * Keeps the literal type of a route (its statuses and schemas), which the client reads. A route is
 * its own `Address`.
 */
export const defineRoute = <const R extends RouteSpec>(route: R): R & Address<R> => route;

/**
 * An address typed from the route: `addressOf<typeof listRoute>({ method: "get", path: "/api/x" })`
 * fails to compile when the route's method or path is not those.
 */
export const addressOf = <R extends RouteSpec>(address: {
  method: R["method"];
  path: R["path"];
}): Address<R> => address;
