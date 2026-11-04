import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import type { RouteSpec, SignIn } from "@forgeron/platform-contract";
import { HTTPException } from "hono/http-exception";
import type { Hosting } from "@forgeron/hosting";
import type { Consent, IdentityConfig, Invitation, Registry } from "@forgeron/registry";
import type { MiddlewareHandler } from "hono";
import type { Person } from "../kernel/person";

// The platform API under `/console-api` as one Hono app (D-064, FOR-150). Routes move here one
// handler at a time: Hono answers the paths it owns, and for any other path it answers 404 with
// `UNMATCHED`, which tells `createGateway` to go on with the hand-written chain. Everything that
// could change an answer for a path Hono does not own is therefore attached to a route, never to
// the app: a guard on `*` would refuse a legacy path before the chain saw it.

/** The person the request is from, as the hand-written handlers see them. */
export interface ConsolePerson {
  id: string;
  email: string;
  name: string;
  admin: boolean;
  developer: boolean;
  roles: string[];
}

/** What the routes outside `/console-api` need: the token secret and who is calling. */
interface BearerBindings {
  /** `AUTH_SECRET`: the key deployment and personal tokens are signed with. */
  secret: string;
  /** The person behind a session or a token of `forgeron login`, if any. */
  person(): Promise<Person | undefined>;
  /** The person of the session cookie alone, if any. */
  session(): Promise<Person | undefined>;
}

/** What the gateway hands to each request: Hono's `env`. */
export interface PlatformBindings {
  /**
   * Which path the request came on: `console` for `/console-api/…` (the console's routes), `root`
   * for `/whoami`, `/deploy`… (the CLI's). A route answers only on its own surface.
   */
  surface: "console" | "root";
  /** The gateway's 404 for a path that is no route: a page for a browser, JSON for any other client. */
  notFound(): Response | Promise<Response>;
  /** A person's OAuth consents for the connectors; `undefined` where the gateway cannot seal tokens. */
  consent?(): Promise<Consent>;
  /** Set where identity is on (`AUTH_SECRET`): the routes of the CLI fail closed without it. */
  bearer?: BearerBindings;
  identity(): Promise<ConsolePerson | undefined>;
  registry: Registry;
  /** The workspace the request was dispatched to. */
  workspace: string;
  /** The workspace's address, `https://acme.forgeron.app`. */
  origin: string;
  /** The platform's base domain (`forgeron.app`). */
  baseDomain: string;
  /** Which sign-in methods are on, for the workspace route. */
  signIn(): Promise<SignIn>;
  /** Domains from the install (`--member-email-domains`): used until an admin saves their own. */
  installDomains: string[];
  now(): Date;
  /** Tells an invited address where to sign in. Best effort: `false` when it could not be sent. */
  notify?(invitation: Invitation): Promise<boolean>;
  /** The sign-in configuration (D-041): the provider and the connectors' OAuth clients. */
  config: IdentityConfig;
  /** Whether the gateway can seal a secret (`SECRETS_KEY` is bound). */
  canKeepSecrets: boolean;
  /** The hosting of the workspace, to reach a tool's database; `undefined` where there is none. */
  hosting(workspace: string): Hosting | undefined;
  /** How long the explorer waits for a statement (default 10 s); tests shorten it. */
  databaseTimeoutMs?: number;
}

export type PlatformEnv = { Bindings: PlatformBindings; Variables: { person: ConsolePerson } };

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
 * A write that a browser sends from another origin is refused, whatever the cookie says (D-073). A
 * browser always tells where a write comes from: `Origin` on every write that is not a `GET`, and
 * `Sec-Fetch-Site` on every request, neither of which a page can set. A client that is not a browser
 * (the CLI, a script with a token) sends neither and is not asked: it has no ambient cookie to abuse.
 * This is a second lock behind the JSON-only rule below, not a replacement for it.
 */
export function crossOriginWrite(request: Request): boolean {
  const site = request.headers.get("sec-fetch-site");
  if (site === "same-origin") return false;
  if (site === "cross-site" || site === "same-site") return true;
  const origin = request.headers.get("origin");
  return origin !== null && origin !== new URL(request.url).origin;
}

const sameOriginOnly: MiddlewareHandler<PlatformEnv> = async (c, next) => {
  if (crossOriginWrite(c.req.raw)) {
    return answer(403, "FORBIDDEN", "Cross-origin writes are refused.");
  }
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
  const changes = spec.method !== "get";
  // A body is JSON; a write without one (a revocation, a deletion) has nothing to type.
  const hasBody = spec.request?.body !== undefined;
  return createRoute({
    ...spec,
    middleware: [
      guard(access, forbidden),
      ...(changes ? [sameOriginOnly] : []),
      ...(hasBody ? [jsonOnly] : []),
    ],
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
      if (error.status === 415) return c.json({ error: "INVALID", message: "Send JSON." }, 415);
      // A body that is not JSON at all, against one that is JSON the schema refuses.
      const malformed = /malformed json/i.test(error.message);
      return c.json(
        { error: "INVALID", message: malformed ? "The body is not JSON." : "Invalid input." },
        400,
      );
    }
    throw error;
  });
  app.notFound((c) => c.env.notFound());
  return app;
}
