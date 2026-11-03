import { workspaceOf } from "../dispatch/dispatch";
import {
  completeLogin,
  startLogin,
  type Identity,
  type LoginState,
  type OidcFetch,
  type OidcProvider,
} from "./oidc";
import { seal, unseal } from "./sealed";
import { closeSession, cookieOf, openSession } from "./session";

// `/auth/login`, `/auth/callback` and `/auth/logout` of a workspace: sign-in through the workspace's
// identity provider, then a session cookie. The platform paths belong to the gateway, never to a tool.

const STATE_COOKIE = "__Host-fg_login";
const STATE_PREFIX = "fgl";
// The time the person has to sign in at the provider.
const STATE_SECONDS = 600;

export interface AuthOptions {
  baseDomain: string;
  secret: string;
  /** The workspace's identity provider; `undefined` if it has none configured. */
  providerFor(workspace: string): OidcProvider | undefined | Promise<OidcProvider | undefined>;
  /**
   * Maps what the provider says to a person of the workspace (id and roles live there):
   * `undefined` if this identity is not a member, who is then refused.
   */
  resolvePerson(
    workspace: string,
    identity: Identity,
  ): { id: string } | undefined | Promise<{ id: string } | undefined>;
  fetch: OidcFetch;
  now(): Date;
  /** How long a session lives. No default: the platform decides. */
  sessionTtlSeconds: number;
}

const json = (status: number, code: string, message: string) =>
  Response.json({ error: { code, message } }, { status });

// Where a sign-in may send the person back to: the CLI's own page, nowhere else.
const safeNext = (next: unknown): string | undefined =>
  typeof next === "string" && /^\/auth\/cli\?[^\s]*$/.test(next) ? next : undefined;

const stateCookie = (value: string, maxAge: number) =>
  `${STATE_COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;

export function createAuth(options: AuthOptions) {
  return async function auth(request: Request): Promise<Response | undefined> {
    const url = new URL(request.url);
    if (!url.pathname.startsWith("/auth/")) return undefined;
    const workspace = workspaceOf(url.host, options.baseDomain);
    if (!workspace) return json(404, "NOT_FOUND", "Not found.");

    if (url.pathname === "/auth/logout") {
      return new Response(null, {
        status: 302,
        headers: { location: "/", "set-cookie": closeSession() },
      });
    }
    const provider = await options.providerFor(workspace);
    if (!provider) return json(404, "NOT_FOUND", "This workspace has no sign-in configured.");

    if (url.pathname === "/auth/login") {
      const { url: target, login } = await startLogin(provider, options.fetch);
      const exp = Math.floor(options.now().getTime() / 1000) + STATE_SECONDS;
      const next = safeNext(url.searchParams.get("next"));
      const sealed = await seal(
        STATE_PREFIX,
        { ...login, ws: workspace, exp, ...(next ? { next } : {}) },
        options.secret,
      );
      return new Response(null, {
        status: 302,
        headers: { location: target, "set-cookie": stateCookie(sealed, STATE_SECONDS) },
      });
    }

    if (url.pathname === "/auth/callback") {
      const kept = cookieOf(request, STATE_COOKIE);
      const claims = kept ? await unseal(STATE_PREFIX, kept, options.secret) : undefined;
      const expired =
        typeof claims?.exp !== "number" || options.now().getTime() / 1000 >= claims.exp;
      if (!claims || expired || claims.ws !== workspace) {
        return json(400, "INVALID", "The sign-in did not start here, or took too long.");
      }
      let identity: Identity;
      try {
        identity = await completeLogin({
          provider,
          fetch: options.fetch,
          now: options.now(),
          query: url.searchParams,
          login: claims as unknown as LoginState,
        });
      } catch (error) {
        return json(
          401,
          "UNAUTHENTICATED",
          error instanceof Error ? error.message : "Sign-in failed.",
        );
      }
      const person = await options.resolvePerson(workspace, identity);
      if (!person) return json(403, "FORBIDDEN", "You are not a member of this workspace.");
      const headers = new Headers({ location: safeNext(claims.next) ?? "/" });
      headers.append(
        "set-cookie",
        await openSession(
          { person: person.id, workspace },
          { secret: options.secret, ttlSeconds: options.sessionTtlSeconds, now: options.now() },
        ),
      );
      headers.append("set-cookie", stateCookie("", 0));
      return new Response(null, { status: 302, headers });
    }
    return json(404, "NOT_FOUND", "Not found.");
  };
}
