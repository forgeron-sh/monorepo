import type { Registry } from "@forgeron/registry";
import type { Person } from "./authenticate";
import { CLI_SCOPE } from "./caller";
import { seal, toBase64Url, unseal } from "./sealed";
import { issueToken } from "./tokens";

// `forgeron login` (D-025, D-028): `GET /auth/cli` sends the signed-in browser back to the CLI's
// loopback address with a one-time code; `POST /auth/cli/token` trades the code, with the PKCE
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
  registry: Registry;
  now(): Date;
  /** The person of the session cookie; `undefined` if there is none. */
  session(request: Request): Promise<Person | undefined>;
}

export async function handleCliAuthorize(request: Request, context: CliLoginContext) {
  const url = new URL(request.url);
  const query = url.searchParams;
  const redirectUri = query.get("redirect_uri") ?? "";
  const state = query.get("state") ?? "";
  const challenge = query.get("code_challenge") ?? "";
  if (!LOOPBACK.test(redirectUri)) {
    return fail(400, "INVALID", "redirect_uri: only the CLI's loopback address.");
  }
  if (!state || !challenge || query.get("code_challenge_method") !== "S256") {
    return fail(400, "INVALID", "state and a S256 code_challenge are required.");
  }

  const person = await context.session(request);
  if (!person) {
    // Sign in through the workspace's provider, then come back here.
    const next = `${url.pathname}${url.search}`;
    return new Response(null, {
      status: 302,
      headers: { location: `/auth/login?next=${encodeURIComponent(next)}` },
    });
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
  const back = new URL(redirectUri);
  back.search = new URLSearchParams({ code, state }).toString();
  return new Response(null, { status: 302, headers: { location: back.toString() } });
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
