import type { Identity } from "../authn/identity";
import { negotiated } from "../../pages/errors";
import {
  completeLogin,
  startLogin,
  type LoginState,
  type OidcFetch,
  type OidcProvider,
} from "./oidc";
import {
  completeSamlLogin,
  samlMetadata,
  startSamlLogin,
  type SamlLogin,
  type SamlProvider,
  type SamlRequests,
} from "./saml";
import { seal, unseal } from "../authn/sealed";
import { closeSession, cookieOf, openSession } from "../authn/session";

// `/auth/login`, `/auth/callback` and `/auth/logout` of a workspace: sign-in through the workspace's
// identity provider, then a session cookie. The platform paths belong to the gateway, never to a tool.

const STATE_COOKIE = "__Host-fg_login";
const STATE_PREFIX = "fgl";
// SAML answers with a cross-site POST, which a `SameSite=Lax` cookie does not travel with: the
// short-lived state cookie of a SAML sign-in is `SameSite=None` (the session cookie stays Lax).
const SAML_COOKIE = "__Host-fg_saml";
const SAML_PREFIX = "fgm";
// The time the person has to sign in at the provider.
const STATE_SECONDS = 600;

export interface AuthOptions {
  /** The workspace a host serves (D-126). */
  workspaceOf(host: string): string | undefined;
  /**
   * The workspace's primary origin (D-126), where the redirect URI of its provider is. A sign-in
   * started on another host moves there first. `undefined`: the sign-in stays on the host it is on.
   */
  primaryOrigin?(workspace: string): string | undefined;
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
  /** The workspace's SAML provider (D-050), if it has one: it wins over `providerFor`. */
  samlFor?(workspace: string): SamlProvider | undefined | Promise<SamlProvider | undefined>;
  samlRequests?: SamlRequests;
  fetch: OidcFetch;
  now(): Date;
  /** How long a session lives. No default: the platform decides. */
  sessionTtlSeconds: number;
}

const json = (status: number, code: string, message: string) =>
  Response.json({ error: { code, message } }, { status });

/** The JSON error of an API client, a page of the shell for a browser. */
const failure = (
  request: Request,
  status: number,
  code: string,
  message: string,
  workspace?: string,
) =>
  negotiated(request, status, json(status, code, message), {
    detail: message,
    ...(workspace ? { workspace } : {}),
  });

// Where a sign-in may send the person back to: the CLI's own page, nowhere else.
export const safeNext = (next: unknown): string | undefined =>
  typeof next === "string" && /^\/auth\/cli\?[^\s]*$/.test(next) ? next : undefined;

const stateCookie = (value: string, maxAge: number) =>
  `${STATE_COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;

const samlCookie = (value: string, maxAge: number) =>
  `${SAML_COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=${maxAge}`;

export function createAuth(options: AuthOptions) {
  // A person of the workspace gets a session, or is refused.
  async function openFor(
    request: Request,
    workspace: string,
    identity: Identity,
    next: unknown,
    clear: string,
    // 303 after a POST (the browser then follows with a GET), 302 after the OIDC redirect.
    status: 302 | 303,
  ): Promise<Response> {
    const person = await options.resolvePerson(workspace, identity);
    if (!person)
      return failure(
        request,
        403,
        "FORBIDDEN",
        "You are not a member of this workspace.",
        workspace,
      );
    const headers = new Headers({ location: safeNext(next) ?? "/" });
    headers.append(
      "set-cookie",
      await openSession(
        { person: person.id, workspace },
        { secret: options.secret, ttlSeconds: options.sessionTtlSeconds, now: options.now() },
      ),
    );
    headers.append("set-cookie", clear);
    return new Response(null, { status, headers });
  }

  return async function auth(request: Request): Promise<Response | undefined> {
    const url = new URL(request.url);
    if (!url.pathname.startsWith("/auth/")) return undefined;
    const workspace = options.workspaceOf(url.host);
    if (!workspace) return failure(request, 404, "NOT_FOUND", "Not found.");
    // The provider sends the person back to the primary origin: the state cookie must be set there.
    const primary = options.primaryOrigin?.(workspace);
    if (
      url.pathname === "/auth/login" &&
      request.method === "GET" &&
      primary &&
      primary !== url.origin
    ) {
      return new Response(null, {
        status: 302,
        headers: { location: `${primary}${url.pathname}${url.search}` },
      });
    }

    if (url.pathname === "/auth/logout") {
      return new Response(null, {
        status: 302,
        headers: { location: "/auth/login?reason=signed-out", "set-cookie": closeSession() },
      });
    }
    const saml = options.samlFor ? await options.samlFor(workspace) : undefined;
    if (saml && options.samlRequests) {
      const requests = options.samlRequests;
      if (url.pathname === "/auth/saml/metadata" && request.method === "GET") {
        return new Response(samlMetadata(saml), {
          headers: { "content-type": "application/samlmetadata+xml" },
        });
      }
      if (url.pathname === "/auth/login") {
        const now = options.now();
        const { url: target, login } = await startSamlLogin({
          provider: saml,
          workspace,
          requests,
          now,
          seconds: STATE_SECONDS,
        });
        const next = safeNext(url.searchParams.get("next"));
        const sealed = await seal(
          SAML_PREFIX,
          {
            ...login,
            ws: workspace,
            exp: Math.floor(now.getTime() / 1000) + STATE_SECONDS,
            ...(next ? { next } : {}),
          },
          options.secret,
        );
        return new Response(null, {
          status: 302,
          headers: { location: target, "set-cookie": samlCookie(sealed, STATE_SECONDS) },
        });
      }
      if (url.pathname === "/auth/saml/acs" && request.method === "POST") {
        const kept = cookieOf(request, SAML_COOKIE);
        const claims = kept ? await unseal(SAML_PREFIX, kept, options.secret) : undefined;
        const expired =
          typeof claims?.exp !== "number" || options.now().getTime() / 1000 >= claims.exp;
        if (!claims || expired || claims.ws !== workspace) {
          return failure(
            request,
            400,
            "INVALID",
            "The sign-in did not start here, or took too long.",
          );
        }
        let identity: Identity;
        try {
          const body = await request.text();
          if (body.length > 800_000) throw new Error("The response is too large.");
          identity = await completeSamlLogin({
            provider: saml,
            workspace,
            requests,
            now: options.now(),
            form: new URLSearchParams(body),
            login: claims as unknown as SamlLogin,
          });
        } catch (error) {
          return failure(
            request,
            401,
            "UNAUTHENTICATED",
            error instanceof Error ? error.message : "Sign-in failed.",
          );
        }
        return openFor(request, workspace, identity, claims.next, samlCookie("", 0), 303);
      }
      if (url.pathname.startsWith("/auth/saml/"))
        return failure(request, 404, "NOT_FOUND", "Not found.");
    }
    const provider = await options.providerFor(workspace);
    if (!provider)
      return failure(request, 404, "NOT_FOUND", "This workspace has no sign-in configured.");

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
        return failure(
          request,
          400,
          "INVALID",
          "The sign-in did not start here, or took too long.",
        );
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
        return failure(
          request,
          401,
          "UNAUTHENTICATED",
          error instanceof Error ? error.message : "Sign-in failed.",
        );
      }
      return openFor(request, workspace, identity, claims.next, stateCookie("", 0), 302);
    }
    return failure(request, 404, "NOT_FOUND", "Not found.");
  };
}
