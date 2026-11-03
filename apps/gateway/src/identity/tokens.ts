import { audienceOf } from "./audience";

// Audience-bound tokens for the API and the CLI (sdk.md §7). A token is
// `fgt.<claims>.<signature>`: the claims are JSON in base64url, the signature is
// HMAC-SHA256 of `fgt.<claims>` under the gateway's secret. It binds a person to one
// `<workspace>/<tool>` until `exp`; another tool refuses it. Web Crypto only: it runs in a Worker.

const PREFIX = "fgt";

interface TokenClaims {
  /** The person: their id in the workspace. */
  sub: string;
  /** `<workspace>/<tool>`. */
  aud: string;
  /** Issued at, seconds since the epoch. */
  iat: number;
  /** Expires at, seconds since the epoch. */
  exp: number;
  /** The token's own id, what a revocation names. Absent on tokens issued before D-033. */
  jti?: string;
  /** What the token may do besides being a person's: absent on API and CLI tokens (`deploy`…). */
  scp?: string;
}

type TokenFailure = "malformed" | "signature" | "expired" | "audience" | "scope";

export type TokenCheck = { ok: true; claims: TokenClaims } | { ok: false; reason: TokenFailure };

const encoder = new TextEncoder();

const toBase64Url = (bytes: Uint8Array): string =>
  btoa(String.fromCharCode(...bytes))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");

function fromBase64Url(text: string): Uint8Array | undefined {
  if (!/^[A-Za-z0-9_-]*$/.test(text)) return undefined;
  const padded = text
    .replaceAll("-", "+")
    .replaceAll("_", "/")
    .padEnd(Math.ceil(text.length / 4) * 4, "=");
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
}

const keyOf = (secret: string) =>
  crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify",
  ]);

export type { TokenClaims };

export interface IssueOptions {
  secret: string;
  person: string;
  workspace: string;
  tool: string;
  /** How long the token lives. No default: each flow that issues tokens decides. */
  ttlSeconds: number;
  now: Date;
  /** The token's id, for a revocation to name; a random one by default. */
  jti?: string;
  /** A token with a scope is only accepted where that scope is asked for, and nowhere else. */
  scope?: string;
}

export async function issueToken(options: IssueOptions): Promise<string> {
  if (!(options.ttlSeconds > 0)) throw new Error("A token needs a positive lifetime.");
  const iat = Math.floor(options.now.getTime() / 1000);
  const claims: TokenClaims = {
    sub: options.person,
    aud: audienceOf(options.workspace, options.tool),
    iat,
    exp: iat + options.ttlSeconds,
    jti: options.jti ?? crypto.randomUUID(),
    ...(options.scope === undefined ? {} : { scp: options.scope }),
  };
  const body = `${PREFIX}.${toBase64Url(encoder.encode(JSON.stringify(claims)))}`;
  const signature = await crypto.subtle.sign(
    "HMAC",
    await keyOf(options.secret),
    encoder.encode(body),
  );
  return `${body}.${toBase64Url(new Uint8Array(signature))}`;
}

const isClaims = (value: unknown): value is TokenClaims => {
  const claims = value as Partial<TokenClaims> | null;
  return (
    typeof claims === "object" &&
    claims !== null &&
    typeof claims.sub === "string" &&
    typeof claims.aud === "string" &&
    Number.isFinite(claims.iat) &&
    Number.isFinite(claims.exp) &&
    (claims.jti === undefined || typeof claims.jti === "string") &&
    (claims.scp === undefined || typeof claims.scp === "string")
  );
};

/**
 * Checks signature, expiry, the scope (none unless `scope` is given) and, when `audience` is given,
 * that the token was issued for it.
 * The signature is checked first: nothing in an unsigned token is trusted.
 */
export async function verifyToken(
  token: string,
  options: {
    secret: string;
    /**
     * Keys the gateway signed with before a rotation (D-033): a token they signed is still good
     * until its `exp`, and nothing new is signed with them.
     */
    previousSecrets?: string[];
    now: Date;
    audience?: string;
    scope?: string;
  },
): Promise<TokenCheck> {
  const parts = token.split(".");
  const [prefix, payload, signature] = parts;
  if (parts.length !== 3 || prefix !== PREFIX || !payload || !signature) {
    return { ok: false, reason: "malformed" };
  }
  const signed = fromBase64Url(signature);
  const raw = fromBase64Url(payload);
  if (!signed || !raw) return { ok: false, reason: "malformed" };
  let valid = false;
  for (const secret of [options.secret, ...(options.previousSecrets ?? [])]) {
    valid = await crypto.subtle.verify(
      "HMAC",
      await keyOf(secret),
      signed,
      encoder.encode(`${prefix}.${payload}`),
    );
    if (valid) break;
  }
  if (!valid) return { ok: false, reason: "signature" };
  let claims: unknown;
  try {
    claims = JSON.parse(new TextDecoder().decode(raw));
  } catch {
    return { ok: false, reason: "malformed" };
  }
  if (!isClaims(claims)) return { ok: false, reason: "malformed" };
  if (options.now.getTime() / 1000 >= claims.exp) return { ok: false, reason: "expired" };
  if (options.audience !== undefined && claims.aud !== options.audience) {
    return { ok: false, reason: "audience" };
  }
  // A scoped token (deployment) is not a person's API token, and the other way round.
  if (claims.scp !== options.scope) return { ok: false, reason: "scope" };
  return { ok: true, claims };
}
