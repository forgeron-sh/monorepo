import { importCertificate, type PinnedKey } from "./saml-cert";
import { attribute, canonicalize, childrenNamed, textOf, type XmlElement } from "./saml-xml";
import { fromBase64Url } from "./sealed";

// XML signature verification for SAML (D-050), written for exactly what SAML uses and nothing more:
//  - the key is a certificate the administrator pinned; `KeyInfo` in the message is never read;
//  - one `Reference`, `URI="#<ID of the element the Signature is a child of>"`, enveloped-signature
//    then exclusive C14N, SHA-256 digest; RSA-SHA256 or ECDSA-SHA256 signature over exclusive C14N
//    of `SignedInfo`; any other algorithm is refused;
//  - the caller reads data only from the element returned as signed, never by looking an id up.

export const DS = "http://www.w3.org/2000/09/xmldsig#";
const EXC_C14N = "http://www.w3.org/2001/10/xml-exc-c14n#";
const ENVELOPED = `${DS}enveloped-signature`;
const RSA_SHA256 = "http://www.w3.org/2001/04/xmldsig-more#rsa-sha256";
const ECDSA_SHA256 = "http://www.w3.org/2001/04/xmldsig-more#ecdsa-sha256";
const SHA256 = "http://www.w3.org/2001/04/xmlenc#sha256";

class SignatureError extends Error {
  override name = "SignatureError";
}

const fail = (message: string): never => {
  throw new SignatureError(message);
};

function base64(text: string | undefined): Uint8Array {
  const clean = (text ?? "").replace(/\s+/g, "");
  if (clean === "") return fail("A signature value is empty.");
  const bytes = fromBase64Url(clean.replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, ""));
  return bytes ?? fail("A signature value is not base64.");
}

const equal = (a: Uint8Array, b: Uint8Array) => {
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  return diff === 0;
};

/** The `PrefixList` of an `InclusiveNamespaces` child (the only child an algorithm element may have). */
function inclusiveOf(algorithm: XmlElement): string[] {
  const extra = algorithm.children.filter((c): c is XmlElement => typeof c !== "string");
  if (extra.length === 0) return [];
  const only = extra[0]!;
  if (extra.length > 1 || only.ns !== EXC_C14N || only.local !== "InclusiveNamespaces") {
    return fail("An algorithm has a parameter that is not supported.");
  }
  const list = attribute(only, "PrefixList");
  return list ? list.split(/\s+/).filter(Boolean) : [];
}

const one = (parent: XmlElement, local: string): XmlElement => {
  const found = childrenNamed(parent, DS, local);
  return found.length === 1 ? found[0]! : fail(`A signature needs exactly one ${local}.`);
};

/**
 * Verifies a `Signature` that is a child of `signed`. Returns normally only if the signature covers
 * `signed` (its whole subtree, the signature itself excepted) and a pinned key made it.
 */
export async function verifySignature(
  signature: XmlElement,
  signed: XmlElement,
  keys: PinnedKey[],
): Promise<void> {
  const id = attribute(signed, "ID");
  if (!id) return fail("The signed element has no ID.");
  const signedInfo = one(signature, "SignedInfo");
  const signatureValue = base64(textOf(one(signature, "SignatureValue")));

  const canonicalization = one(signedInfo, "CanonicalizationMethod");
  if (attribute(canonicalization, "Algorithm") !== EXC_C14N) {
    return fail("Only exclusive canonicalization without comments is supported.");
  }
  const signatureAlgorithm = attribute(one(signedInfo, "SignatureMethod"), "Algorithm");
  if (signatureAlgorithm !== RSA_SHA256 && signatureAlgorithm !== ECDSA_SHA256) {
    return fail("Only RSA-SHA256 and ECDSA-SHA256 signatures are supported.");
  }

  const reference = one(signedInfo, "Reference");
  // The reference must point at the element the signature sits in: a signature copied elsewhere
  // (signature wrapping) names an element it does not cover there.
  if (attribute(reference, "URI") !== `#${id}`) {
    return fail("The signature does not reference the element it belongs to.");
  }
  const transforms = childrenNamed(one(reference, "Transforms"), DS, "Transform");
  const algorithms = transforms.map((t) => attribute(t, "Algorithm"));
  if (algorithms.length !== 2 || algorithms[0] !== ENVELOPED || algorithms[1] !== EXC_C14N) {
    return fail("The transforms must be enveloped-signature then exclusive C14N.");
  }
  if (inclusiveOf(transforms[0]!).length > 0) return fail("A transform has a parameter.");
  const inclusive = inclusiveOf(transforms[1]!);
  if (attribute(one(reference, "DigestMethod"), "Algorithm") !== SHA256) {
    return fail("Only SHA-256 digests are supported.");
  }
  const expected = base64(textOf(one(reference, "DigestValue")));
  const encoder = new TextEncoder();
  const digest = new Uint8Array(
    await crypto.subtle.digest(
      "SHA-256",
      encoder.encode(canonicalize(signed, { omit: signature, inclusive })),
    ),
  );
  if (!equal(digest, expected)) return fail("The digest does not match: the content was altered.");

  const message = encoder.encode(
    canonicalize(signedInfo, { inclusive: inclusiveOf(canonicalization) }),
  );
  for (const { key, kind } of keys) {
    if ((signatureAlgorithm === RSA_SHA256) !== (kind === "rsa")) continue;
    const valid = await crypto.subtle.verify(
      kind === "rsa" ? { name: "RSASSA-PKCS1-v1_5" } : { name: "ECDSA", hash: "SHA-256" },
      key,
      signatureValue,
      message,
    );
    if (valid) return;
  }
  return fail("The signature was not made by a pinned certificate.");
}

/** The pinned keys of a provider; throws if one certificate is not usable. */
export const pinnedKeys = (certificates: string[]): Promise<PinnedKey[]> =>
  Promise.all(certificates.map((c) => importCertificate(c)));
