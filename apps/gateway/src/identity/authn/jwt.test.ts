import { describe, expect, it } from "vitest";
import {
  checkClaims,
  importRsaPrivateKey,
  JwtError,
  looksLikeJwt,
  signRs256,
  verifyRs256,
  type Jwk,
} from "./jwt";
import { toBase64Url } from "./sealed";

const pair = await crypto.subtle.generateKey(
  {
    name: "RSASSA-PKCS1-v1_5",
    modulusLength: 2048,
    publicExponent: new Uint8Array([1, 0, 1]),
    hash: "SHA-256",
  },
  true,
  ["sign", "verify"],
);
const publicJwk = { ...(await crypto.subtle.exportKey("jwk", pair.publicKey)), kid: "k1" } as Jwk;
const pkcs8 = new Uint8Array(await crypto.subtle.exportKey("pkcs8", pair.privateKey));

const pemOf = (label: string, der: Uint8Array) =>
  `-----BEGIN ${label}-----\n${btoa(String.fromCharCode(...der))
    .match(/.{1,64}/g)!
    .join("\n")}\n-----END ${label}-----\n`;

/** The PKCS#1 key inside a PKCS#8 one: the content of its last OCTET STRING, as GitHub gives it. */
function pkcs1Of(der: Uint8Array): Uint8Array {
  // SEQUENCE { INTEGER 0, SEQUENCE { OID, NULL }, OCTET STRING { … } }
  let at = 1;
  const length = () => {
    const first = der[at++]!;
    if (first < 0x80) return first;
    let value = 0;
    for (let i = 0; i < (first & 0x7f); i++) value = (value << 8) | der[at++]!;
    return value;
  };
  length();
  at += 3; // INTEGER 0
  at += 1 + 1 + der[at + 1]!; // AlgorithmIdentifier
  if (der[at++] !== 0x04) throw new Error("not an OCTET STRING");
  const size = length();
  return der.slice(at, at + size);
}

describe("RS256 tokens", () => {
  it("signs with a PKCS#8 key, and the public key verifies it", async () => {
    const key = await importRsaPrivateKey(pemOf("PRIVATE KEY", pkcs8));
    const token = await signRs256({ iss: "me", n: 1 }, key, "k1");
    expect(looksLikeJwt(token)).toBe(true);
    expect(await verifyRs256(token, [publicJwk])).toEqual({ iss: "me", n: 1 });
  });

  it("imports a PKCS#1 key (BEGIN RSA PRIVATE KEY), as GitHub gives it", async () => {
    const key = await importRsaPrivateKey(pemOf("RSA PRIVATE KEY", pkcs1Of(pkcs8)));
    const token = await signRs256({ iss: "123" }, key, "k1");
    expect(await verifyRs256(token, [publicJwk])).toEqual({ iss: "123" });
  });

  it("verifies against a key set, by kid, and refuses what it should", async () => {
    const token = await signRs256({ iss: "x" }, pair.privateKey, "k1");
    expect(await verifyRs256(token, [publicJwk])).toEqual({ iss: "x" });
    expect(await verifyRs256(token, async () => [publicJwk])).toEqual({ iss: "x" });
    await expect(verifyRs256(token, [{ ...publicJwk, kid: "k2" }])).rejects.toThrow("unknown key");
    const [h, , s] = token.split(".");
    const forged = `${h}.${toBase64Url(new TextEncoder().encode('{"iss":"y"}'))}.${s}`;
    await expect(verifyRs256(forged, [publicJwk])).rejects.toThrow("signature is not valid");
    const none = `${toBase64Url(new TextEncoder().encode('{"alg":"none","kid":"k1"}'))}.${forged.split(".")[1]}.`;
    await expect(verifyRs256(none, [publicJwk])).rejects.toThrow(JwtError);
    await expect(verifyRs256("a.b", [publicJwk])).rejects.toThrow("malformed");
    // A malformed token does not cost a read of the key set.
    let read = false;
    await expect(
      verifyRs256("nope", async () => {
        read = true;
        return [publicJwk];
      }),
    ).rejects.toThrow("malformed");
    expect(read).toBe(false);
  });

  it("refuses a key that is not a PEM RSA key", async () => {
    await expect(importRsaPrivateKey("not a key")).rejects.toThrow(JwtError);
  });
});

describe("checkClaims", () => {
  const now = new Date("2026-11-10T12:00:00Z");
  const t = now.getTime() / 1000;
  const ok = { iss: "i", aud: "a", exp: t + 60 };
  const check = (claims: Record<string, unknown>) =>
    checkClaims(claims, { issuer: "i", audience: "a", now });

  it("takes a token for its issuer and audience, before it expires", () => {
    expect(() => check(ok)).not.toThrow();
    expect(() => check({ ...ok, aud: ["b", "a"] })).not.toThrow();
    expect(() => check({ ...ok, nbf: t + 30 })).not.toThrow();
  });

  it("refuses another issuer, another audience, an expired or early token", () => {
    expect(() => check({ ...ok, iss: "j" })).toThrow("another issuer");
    expect(() => check({ ...ok, aud: "b" })).toThrow("another audience");
    expect(() => check({ ...ok, exp: t })).toThrow("expired");
    expect(() => check({ ...ok, exp: undefined })).toThrow("expired");
    expect(() => check({ ...ok, nbf: t + 120 })).toThrow("not valid yet");
  });
});
