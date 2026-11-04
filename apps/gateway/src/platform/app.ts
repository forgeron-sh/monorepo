import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import type { RouteSpec } from "@forgeron/platform-contract";
import { HTTPException } from "hono/http-exception";
import type { Registry } from "@forgeron/registry";
import type { MiddlewareHandler } from "hono";

// The platform API under `/console-api` as one Hono app (D-064, FOR-150). Routes move here one
// handler at a time: Hono answers the paths it owns, and for any other path it answers 404 with
// `UNMATCHED`, which tells `createGateway` to go on with the hand-written chain. Everything that
// could change an answer for a path Hono does not own is therefore attached to a route, never to
// the app: a guard on `*` would refuse a legacy path before the chain saw it.

/** The person the request is from, as the hand-written handlers see them. */
export interface ConsolePerson {
  id: string;
  admin: boolean;
  developer: boolean;
  roles: string[];
}

/** What the gateway hands to each request: Hono's `env`. */
interface PlatformBindings {
  identity(): Promise<ConsolePerson | undefined>;
  registry: Registry;
  /** The workspace the request was dispatched to. */
  workspace: string;
  /** The workspace's address, `https://acme.forgeron.app`. */
  origin: string;
}

export type PlatformEnv = { Bindings: PlatformBindings; Variables: { person: ConsolePerson } };

/** Set on the 404 of a path Hono does not own: the legacy chain answers it. */
export const UNMATCHED = "x-forgeron-unmatched";

/** Who may call a route: any signed-in member, an admin or a developer, or an admin. */
export type Access = "member" | "developer" | "admin";

const FORBIDDEN: Record<Exclude<Access, "member">, string> = {
  admin: "This is for admins.",
  developer: "This is for admins and developers.",
};

const answer = (status: 400 | 401 | 403 | 415, error: string, message?: string) =>
  Response.json(message ? { error, message } : { error }, {
    status,
    headers: { "cache-control": "no-store" },
  });

/** 401 for nobody, 403 for a member on an admin route: the order of the hand-written handlers. */
const guard =
  (access: Access, forbidden?: string): MiddlewareHandler<PlatformEnv> =>
  async (c, next) => {
    const person = await c.env.identity();
    if (!person) return answer(401, "UNAUTHENTICATED");
    if (access !== "member" && !person.admin && (access === "admin" || !person.developer)) {
      return answer(403, "FORBIDDEN", forbidden ?? FORBIDDEN[access]);
    }
    c.set("person", person);
    await next();
  };

/**
 * A write is JSON: a form post from another site cannot send that content type without our
 * consent, and on the console API it is the cross-site guard besides the session cookie.
 */
const jsonOnly: MiddlewareHandler<PlatformEnv> = async (c, next) => {
  if (!(c.req.header("content-type") ?? "").startsWith("application/json")) {
    return answer(415, "INVALID", "Send JSON.");
  }
  await next();
};

/**
 * A contract route with its guards: identity, role, then JSON-only on a route that takes a body.
 * Pass the result to `app.openapi(…, handler)`.
 */
export function platformRoute<const R extends RouteSpec>(
  spec: R,
  access: Access,
  /** The `message` of the 403, when a route says it in its own words. */
  forbidden?: string,
) {
  const writes = spec.method === "post" || spec.method === "put" || spec.method === "patch";
  return createRoute({
    ...spec,
    middleware: writes ? [guard(access, forbidden), jsonOnly] : [guard(access, forbidden)],
  });
}

/** Signed in, any role: for a route that is not in the contract (the OpenAPI document). */
export const memberOnly = guard("member");

/** 405 for a method a path does not take, before anyone is asked who they are (as the old handlers did). */
export const methodNotAllowed: MiddlewareHandler<PlatformEnv> = async (c) =>
  c.json({ error: "METHOD_NOT_ALLOWED" }, 405);

export function createPlatformApp() {
  const app = new OpenAPIHono<PlatformEnv>({
    // The shape the hand-written validators answer with.
    defaultHook: (result, c) =>
      result.success ? undefined : c.json({ error: "INVALID", message: "Invalid input." }, 400),
  });
  app.use("*", async (c, next) => {
    await next();
    // Nothing is cached unless a route says so (an image keyed by its hash does).
    if (!c.res.headers.has("cache-control")) c.header("cache-control", "no-store");
  });
  app.onError((error, c) => {
    // What Hono throws itself (a body that is not JSON, a wrong media type) is the person's
    // mistake, not a failure. Anything else is a failure: the Worker's own handler logs and answers.
    if (error instanceof HTTPException) {
      return c.json(
        { error: "INVALID", message: error.status === 415 ? "Send JSON." : "Invalid input." },
        error.status === 415 ? 415 : 400,
      );
    }
    throw error;
  });
  app.notFound((c) => c.body(null, 404, { [UNMATCHED]: "1" }));
  return app;
}
