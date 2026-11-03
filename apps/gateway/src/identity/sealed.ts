// A small signed envelope for the gateway's own cookies (the session, the sign-in state):
// `<prefix>.<claims>.<signature>`, claims as base64url JSON, HMAC-SHA256 of `<prefix>.<claims>`.
// The prefix keeps one kind from passing for another. Web Crypto only: it runs in a Worker.

const encoder = new TextEncoder();

export const toBase64Url = (bytes: Uint8Array): string =>
  btoa(String.fromCharCode(...bytes))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");

export function fromBase64Url(text: string): Uint8Array | undefined {
  if (!/^[A-Za-z0-9_-]*$/.test(text)) return undefined;
  const padded = text
    .replaceAll("-", "+")
    .replaceAll("_", "/")
    .padEnd(Math.ceil(text.length / 4) * 4, "=");
  try {
    return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
  } catch {
    return undefined;
  }
}

const keyOf = (secret: string) =>
  crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify",
  ]);

export async function seal(prefix: string, claims: object, secret: string): Promise<string> {
  const body = `${prefix}.${toBase64Url(encoder.encode(JSON.stringify(claims)))}`;
  const signature = await crypto.subtle.sign("HMAC", await keyOf(secret), encoder.encode(body));
  return `${body}.${toBase64Url(new Uint8Array(signature))}`;
}

/** The claims of a sealed value of this prefix, or `undefined` if it is not one or the signature is wrong. */
export async function unseal(
  prefix: string,
  value: string,
  secret: string,
): Promise<Record<string, unknown> | undefined> {
  const parts = value.split(".");
  const [found, payload, signature] = parts;
  if (parts.length !== 3 || found !== prefix || !payload || !signature) return undefined;
  const signed = fromBase64Url(signature);
  const raw = fromBase64Url(payload);
  if (!signed || !raw) return undefined;
  const valid = await crypto.subtle.verify(
    "HMAC",
    await keyOf(secret),
    signed,
    encoder.encode(`${found}.${payload}`),
  );
  if (!valid) return undefined;
  try {
    const claims: unknown = JSON.parse(new TextDecoder().decode(raw));
    return typeof claims === "object" && claims !== null && !Array.isArray(claims)
      ? (claims as Record<string, unknown>)
      : undefined;
  } catch {
    return undefined;
  }
}
