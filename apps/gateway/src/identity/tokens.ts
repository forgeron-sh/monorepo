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
}

type TokenFailure = "malformed" | "signature" | "expired" | "audience";

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

export interface IssueOptions {
  secret: string;
  person: string;
  workspace: string;
  tool: string;
  /** How long the token lives. No default: each flow that issues tokens decides. */
  ttlSeconds: number;
  now: Date;
}

export async function issueToken(options: IssueOptions): Promise<string> {
  if (!(options.ttlSeconds > 0)) throw new Error("A token needs a positive lifetime.");
  const iat = Math.floor(options.now.getTime() / 1000);
  const claims: TokenClaims = {
    sub: options.person,
    aud: audienceOf(options.workspace, options.tool),
    iat,
    exp: iat + options.ttlSeconds,
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
    Number.isFinite(claims.exp)
  );
};

/**
 * Checks signature, expiry and, when `audience` is given, that the token was issued for it.
 * The signature is checked first: nothing in an unsigned token is trusted.
 */
export async function verifyToken(
  token: string,
  options: { secret: string; now: Date; audience?: string },
): Promise<TokenCheck> {
  const parts = token.split(".");
  const [prefix, payload, signature] = parts;
  if (parts.length !== 3 || prefix !== PREFIX || !payload || !signature) {
    return { ok: false, reason: "malformed" };
  }
  const signed = fromBase64Url(signature);
  const raw = fromBase64Url(payload);
  if (!signed || !raw) return { ok: false, reason: "malformed" };
  const valid = await crypto.subtle.verify(
    "HMAC",
    await keyOf(options.secret),
    signed,
    encoder.encode(`${prefix}.${payload}`),
  );
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
  return { ok: true, claims };
}
