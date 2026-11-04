import type { Registry } from "@forgeron/registry";
import type { Person } from "../../kernel/person";
import { authorizationPage, handBackPage } from "../../pages/cli";
import { errorPage } from "../../pages/errors";
import { CLI_SCOPE } from "../authn/caller";
import { sameOriginPost } from "../authn/origin";
import { seal, toBase64Url, unseal } from "../authn/sealed";
import { issueToken } from "../authn/tokens";

// `forgeron login` (D-025, D-028): `GET /auth/cli` asks the signed-in person to authorize the CLI,
// `POST /auth/cli` then sends the browser back to the CLI's loopback address with a one-time code; `POST /auth/cli/token` trades the code, with the PKCE
// verifier, for the person's CLI token.

const PREFIX = "fgc";
const CODE_SECONDS = 60;
/** How long a CLI token lives. It cannot be revoked before (D-015). */
const TOKEN_DAYS = 30;
/** The audience of a CLI token: the platform itself, not a tool (D-028). */
const PLATFORM_TOOL = "platform";
// Only the CLI's one-shot loopback server may receive the code: never another host.
const LOOPBACK = /^http:\/\/127\.0\.0\.1:\d{1,5}\/callback$/;
const encoder = new TextEncoder();

const fail = (status: number, code: string, message: string) =>
  Response.json({ error: { code, message } }, { status });

export interface CliLoginContext {
  workspace: string;
  secret: string;
  registry: Pick<Registry, "findMember" | "spendCode">;
  now(): Date;
  /** The person of the session cookie; `undefined` if there is none. */
  session(request: Request): Promise<Person | undefined>;
}

/** The CLI's request, read from the query of the GET or the body of the confirmation POST. */
function readRequest(params: URLSearchParams) {
  const redirectUri = params.get("redirect_uri") ?? "";
  const state = params.get("state") ?? "";
  const challenge = params.get("code_challenge") ?? "";
  if (!LOOPBACK.test(redirectUri)) {
    return { ok: false, error: "redirect_uri: only the CLI's loopback address." } as const;
  }
  if (!state || !challenge || params.get("code_challenge_method") !== "S256") {
    return { ok: false, error: "state and a S256 code_challenge are required." } as const;
  }
  return { ok: true, redirectUri, state, challenge } as const;
}

/**
 * `GET /auth/cli` asks the signed-in person to authorize the CLI and `POST /auth/cli` carries
 * their answer (D-053): nothing is handed to the loopback address without a click.
 */
export async function handleCliAuthorize(request: Request, context: CliLoginContext) {
  const url = new URL(request.url);
  const posting = request.method === "POST";
  if (request.method !== "GET" && !posting) {
    return errorPage(405, { workspace: context.workspace, headers: { allow: "GET, POST" } });
  }
  // The same rule as the sign-in forms (D-049): the answer comes from the confirmation page itself.
  if (posting && !sameOriginPost(request)) {
    return errorPage(403, {
      workspace: context.workspace,
      detail: "This request did not come from the authorization page.",
    });
  }
  const form = posting ? await request.formData().catch(() => undefined) : undefined;
  if (posting && !form) return errorPage(400, { workspace: context.workspace });
  const params = new URLSearchParams(
    posting
      ? [...form!.entries()].filter((e): e is [string, string] => typeof e[1] === "string")
      : url.searchParams,
  );
  const asked = readRequest(params);
  if (!asked.ok) {
    return request.headers.get("accept")?.includes("text/html")
      ? errorPage(400, { workspace: context.workspace, detail: asked.error })
      : fail(400, "INVALID", asked.error);
  }
  const { redirectUri, state, challenge } = asked;

  const person = await context.session(request);
  if (!person) {
    if (posting) return errorPage(401, { workspace: context.workspace });
    // Sign in through the workspace's provider, then come back here.
    const next = `${url.pathname}${url.search}`;
    return new Response(null, {
      status: 302,
      headers: { location: `/auth/login?next=${encodeURIComponent(next)}` },
    });
  }
  const loopback = new URL(redirectUri);
  if (!posting) {
    return authorizationPage({
      workspace: context.workspace,
      person,
      address: loopback.host,
      tokenDays: TOKEN_DAYS,
      fields: {
        redirect_uri: redirectUri,
        state,
        code_challenge: challenge,
        code_challenge_method: "S256",
      },
    });
  }

  // Back to the CLI with a page, not a redirect: the pages' `form-action 'self'` must not be loosened
  // for the loopback address, and a browser applies it to a redirect that follows a form post.
  if (form!.get("decision") !== "allow") {
    loopback.search = new URLSearchParams({ error: "access_denied", state }).toString();
    return handBackPage({ workspace: context.workspace, to: loopback.toString(), allowed: false });
  }
  const exp = Math.floor(context.now().getTime() / 1000) + CODE_SECONDS;
  const code = await seal(
    PREFIX,
    {
      jti: toBase64Url(crypto.getRandomValues(new Uint8Array(16))),
      sub: person.id,
      ws: context.workspace,
      ch: challenge,
      ru: redirectUri,
      exp,
    },
    context.secret,
  );
  loopback.search = new URLSearchParams({ code, state }).toString();
  return handBackPage({ workspace: context.workspace, to: loopback.toString(), allowed: true });
}

export async function handleCliToken(request: Request, context: CliLoginContext) {
  if (request.method !== "POST") return fail(405, "METHOD_NOT_ALLOWED", "Use POST.");
  let body: { code?: unknown; code_verifier?: unknown; redirect_uri?: unknown } | null;
  try {
    body = (await request.json()) as typeof body;
  } catch {
    body = null;
  }
  const { code, code_verifier: verifier, redirect_uri: redirectUri } = body ?? {};
  if (typeof code !== "string" || typeof verifier !== "string" || typeof redirectUri !== "string") {
    return fail(400, "INVALID", "code, code_verifier and redirect_uri are required.");
  }
  const claims = await unseal(PREFIX, code, context.secret);
  const invalid = () => fail(400, "INVALID", "This sign-in code is not valid, or has expired.");
  if (!claims || claims.ws !== context.workspace) return invalid();
  if (typeof claims.exp !== "number" || context.now().getTime() / 1000 >= claims.exp) {
    return invalid();
  }
  const { sub, jti, ch, ru } = claims;
  if (typeof sub !== "string" || typeof jti !== "string") return invalid();
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(verifier)));
  if (ch !== toBase64Url(digest) || ru !== redirectUri) return invalid();
  // One time: a code already traded is refused, even with the right verifier.
  if (!(await context.registry.spendCode(jti, new Date(claims.exp * 1000)))) return invalid();
  // The person may have been removed since the browser step.
  if (!(await context.registry.findMember(context.workspace, sub))) return invalid();

  const now = context.now();
  const token = await issueToken({
    secret: context.secret,
    person: sub,
    workspace: context.workspace,
    tool: PLATFORM_TOOL,
    ttlSeconds: TOKEN_DAYS * 24 * 60 * 60,
    now,
    scope: CLI_SCOPE,
  });
  return Response.json({ token }, { status: 200, headers: { "cache-control": "no-store" } });
}
