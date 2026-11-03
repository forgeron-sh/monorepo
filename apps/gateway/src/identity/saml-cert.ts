// The public key of a pinned X.509 certificate, read with a minimal DER reader and imported through
// Web Crypto (D-050). The certificate is only a container for the key: its own signature, issuer and
// validity are not checked, because trust comes from the administrator pinning it, and an identity
// provider often keeps signing with a certificate after its stated expiry.

class CertificateError extends Error {
  override name = "CertificateError";
}

type Key = Awaited<ReturnType<typeof crypto.subtle.importKey>>;

export interface PinnedKey {
  key: Key;
  kind: "rsa" | "ec";
}

interface Tlv {
  tag: number;
  start: number;
  end: number;
}

function read(bytes: Uint8Array, at: number): Tlv {
  const tag = bytes[at];
  let length = bytes[at + 1];
  if (tag === undefined || length === undefined) throw new CertificateError("Truncated DER.");
  let start = at + 2;
  if (length & 0x80) {
    const count = length & 0x7f;
    if (count === 0 || count > 3) throw new CertificateError("Unsupported DER length.");
    length = 0;
    for (let k = 0; k < count; k++) length = length * 256 + (bytes[at + 2 + k] ?? 0);
    start = at + 2 + count;
  }
  if (start + length > bytes.length) throw new CertificateError("Truncated DER.");
  return { tag, start, end: start + length };
}

const hex = (bytes: Uint8Array) => [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
const RSA = "2a864886f70d010101";
const EC = "2a8648ce3d0201";
const P256 = "2a8648ce3d030107";

/** DER bytes of a certificate given as PEM or as bare base64 (the content of `X509Certificate`). */
function certificateBytes(text: string): Uint8Array {
  const body = text.replace(/-----(?:BEGIN|END) CERTIFICATE-----/g, "").replace(/\s+/g, "");
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(body)) throw new CertificateError("Not a certificate.");
  try {
    return Uint8Array.from(atob(body), (c) => c.charCodeAt(0));
  } catch {
    throw new CertificateError("Not a certificate.");
  }
}

/** The key of a certificate: RSA (used with RSA-SHA256) or EC P-256 (ECDSA-SHA256), nothing else. */
export async function importCertificate(text: string): Promise<PinnedKey> {
  const der = certificateBytes(text);
  const certificate = read(der, 0);
  if (certificate.tag !== 0x30) throw new CertificateError("Not a certificate.");
  const tbs = read(der, certificate.start);
  if (tbs.tag !== 0x30) throw new CertificateError("Not a certificate.");
  let at = tbs.start;
  if (read(der, at).tag === 0xa0) at = read(der, at).end; // the version
  // serial, signature algorithm, issuer, validity, subject
  for (let k = 0; k < 5; k++) at = read(der, at).end;
  const spki = read(der, at);
  if (spki.tag !== 0x30) throw new CertificateError("Not a certificate.");
  const algorithm = read(der, spki.start);
  const oid = read(der, algorithm.start);
  if (algorithm.tag !== 0x30 || oid.tag !== 0x06) throw new CertificateError("Not a certificate.");
  const kind = hex(der.slice(oid.start, oid.end));
  const spkiBytes = der.slice(at, spki.end);
  if (kind === RSA) {
    const key = await crypto.subtle.importKey(
      "spki",
      spkiBytes,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["verify"],
    );
    const modulus = (key.algorithm as unknown as { modulusLength: number }).modulusLength;
    if (modulus < 2048) throw new CertificateError("The RSA key is shorter than 2048 bits.");
    return { key, kind: "rsa" };
  }
  if (kind === EC) {
    const parameters = read(der, oid.end);
    if (parameters.tag !== 0x06 || hex(der.slice(parameters.start, parameters.end)) !== P256) {
      throw new CertificateError("Only the P-256 curve is supported.");
    }
    const key = await crypto.subtle.importKey(
      "spki",
      spkiBytes,
      { name: "ECDSA", namedCurve: "P-256" },
      false,
      ["verify"],
    );
    return { key, kind: "ec" };
  }
  throw new CertificateError("The certificate key is neither RSA nor EC P-256.");
}
