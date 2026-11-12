// RS256 JSON Web Tokens (D-123): verifying one against a key set (an OIDC provider's ID token, a GitHub
// Actions identity token) and signing one with a private key (a GitHub App's JWT). Only RS256: never
// `none`, never a symmetric algorithm a public key could be abused for. WebCrypto only.
import { fromBase64Url, toBase64Url } from "./sealed";

export interface Jwk {
  kid?: string;
  kty: string;
  n?: string;
  e?: string;
  alg?: string;
  use?: string;
}

export class JwtError extends Error {
  override name = "JwtError";
}

const encoder = new TextEncoder();

/** A key WebCrypto made (the type is not global where Node types are in use). */
type Key = Awaited<ReturnType<typeof crypto.subtle.importKey>>;
const decoder = new TextDecoder();

/** The decoded header or payload of a JWT, or throws. */
function part(jwt: string, index: number): Record<string, unknown> {
  const bytes = fromBase64Url(jwt.split(".")[index] ?? "");
  if (!bytes) throw new JwtError("The token is malformed.");
  try {
    const value: unknown = JSON.parse(decoder.decode(bytes));
    if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error();
    return value as Record<string, unknown>;
  } catch {
    throw new JwtError("The token is malformed.");
  }
}

/** Whether a string has the shape of a JWT (three base64url parts); says nothing of its validity. */
export const looksLikeJwt = (token: string) => /^[\w-]+\.[\w-]+\.[\w-]+$/.test(token);

/**
 * Checks a JWT's RS256 signature against a key set and returns its claims. The key is the one the
 * header names (`kid`). Claims are not checked here: issuer, audience and expiry are the caller's.
 * The keys may be a function: they are then read only for a token of the right shape.
 */
export async function verifyRs256(
  token: string,
  keys: readonly Jwk[] | (() => Promise<readonly Jwk[]>),
): Promise<Record<string, unknown>> {
  if (token.split(".").length !== 3) throw new JwtError("The token is malformed.");
  const header = part(token, 0) as { alg?: unknown; kid?: unknown };
  if (header.alg !== "RS256") throw new JwtError("The token is not signed with RS256.");
  const set = typeof keys === "function" ? await keys() : keys;
  const jwk = set.find((key) => key.kid === header.kid && key.kty === "RSA");
  if (!jwk) throw new JwtError("The token is signed by an unknown key.");
  const key = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const [h, p, s] = token.split(".") as [string, string, string];
  const signature = fromBase64Url(s);
  const valid =
    signature !== undefined &&
    (await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, signature, encoder.encode(`${h}.${p}`)));
  if (!valid) throw new JwtError("The token's signature is not valid.");
  return part(token, 1);
}

/** A provider's key set (`jwks_uri`): read once for the token being checked, never kept. */
export async function fetchJwks(
  fetcher: (url: string, init?: RequestInit) => Promise<Response>,
  uri: string,
): Promise<Jwk[]> {
  const response = await fetcher(uri);
  if (!response.ok) throw new JwtError(`${uri} answered ${response.status}.`);
  const body = (await response.json()) as { keys?: unknown };
  return Array.isArray(body.keys) ? (body.keys as Jwk[]) : [];
}

/** Checks the claims every RS256 token is held to: issuer, audience, expiry, and not before. */
export function checkClaims(
  claims: Record<string, unknown>,
  expected: { issuer: string; audience: string; now: Date },
): void {
  if (claims.iss !== expected.issuer) throw new JwtError("The token comes from another issuer.");
  const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if (!audiences.includes(expected.audience))
    throw new JwtError("The token is for another audience.");
  const now = expected.now.getTime() / 1000;
  if (typeof claims.exp !== "number" || now >= claims.exp)
    throw new JwtError("The token has expired.");
  // A minute of clock skew either way.
  if (typeof claims.nbf === "number" && now + 60 < claims.nbf) {
    throw new JwtError("The token is not valid yet.");
  }
}

const pem = (text: string, label: string) => {
  const match = new RegExp(`-----BEGIN ${label}-----([\\s\\S]+?)-----END ${label}-----`).exec(text);
  if (!match) return undefined;
  return Uint8Array.from(atob(match[1]!.replace(/\s+/g, "")), (c) => c.charCodeAt(0));
};

/** DER length bytes. */
function derLength(length: number): number[] {
  if (length < 0x80) return [length];
  const bytes: number[] = [];
  for (let n = length; n > 0; n >>= 8) bytes.unshift(n & 0xff);
  return [0x80 | bytes.length, ...bytes];
}

/**
 * A PKCS#1 RSA private key (`BEGIN RSA PRIVATE KEY`, what GitHub gives for an app) wrapped as the
 * PKCS#8 structure WebCrypto imports: `SEQUENCE { INTEGER 0, AlgorithmIdentifier rsaEncryption,
 * OCTET STRING <the PKCS#1 key> }`.
 */
function pkcs1ToPkcs8(pkcs1: Uint8Array): Uint8Array {
  const algorithm = [
    0x30, 0x0d, 0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01, 0x05, 0x00,
  ];
  const octets = [0x04, ...derLength(pkcs1.length)];
  const body = [0x02, 0x01, 0x00, ...algorithm, ...octets];
  const total = body.length + pkcs1.length;
  return new Uint8Array([0x30, ...derLength(total), ...body, ...pkcs1]);
}

/** Imports an RSA private key for RS256 signing, from a PKCS#1 or PKCS#8 PEM. */
export async function importRsaPrivateKey(text: string): Promise<Key> {
  const pkcs8 =
    pem(text, "PRIVATE KEY") ??
    (() => {
      const pkcs1 = pem(text, "RSA PRIVATE KEY");
      return pkcs1 ? pkcs1ToPkcs8(pkcs1) : undefined;
    })();
  if (!pkcs8) throw new JwtError("The private key is not a PEM RSA key.");
  return crypto.subtle.importKey(
    "pkcs8",
    pkcs8,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

/** Signs claims as an RS256 JWT; `kid` names the key in the signer's key set. */
export async function signRs256(
  claims: Record<string, unknown>,
  key: Key,
  kid?: string,
): Promise<string> {
  const header = { alg: "RS256", typ: "JWT", ...(kid ? { kid } : {}) };
  const head = toBase64Url(encoder.encode(JSON.stringify(header)));
  const body = toBase64Url(encoder.encode(JSON.stringify(claims)));
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    encoder.encode(`${head}.${body}`),
  );
  return `${head}.${body}.${toBase64Url(new Uint8Array(signature))}`;
}
