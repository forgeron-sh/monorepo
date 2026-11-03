// Encryption of tool secrets at rest: AES-256-GCM through WebCrypto, so it runs in the gateway
// (a Worker) as well as in a script. A secret is bound to its slot (tool, environment, name) by
// the additional authenticated data: a ciphertext copied to another slot does not open.

export interface SealedSecret {
  /** Base64 of the 12-byte nonce. */
  iv: string;
  /** Base64 of the ciphertext with its authentication tag. */
  ciphertext: string;
}

export interface SecretBox {
  seal(slot: string, value: string): Promise<SealedSecret>;
  open(slot: string, sealed: SealedSecret): Promise<string>;
}

const b64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const unb64 = (text: string) => Uint8Array.from(atob(text), (c) => c.charCodeAt(0));

/** `key` is 32 random bytes, base64: the platform's master key, held in the gateway's secrets. */
export async function createSecretBox(key: string): Promise<SecretBox> {
  const raw = unb64(key);
  if (raw.length !== 32) throw new Error("The secret key must be 32 bytes, base64-encoded.");
  const cryptoKey = await crypto.subtle.importKey("raw", raw, "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
  const aad = (slot: string) => new TextEncoder().encode(slot);
  return {
    async seal(slot, value) {
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const data = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv, additionalData: aad(slot) },
        cryptoKey,
        new TextEncoder().encode(value),
      );
      return { iv: b64(iv), ciphertext: b64(new Uint8Array(data)) };
    },
    async open(slot, sealed) {
      const data = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: unb64(sealed.iv), additionalData: aad(slot) },
        cryptoKey,
        unb64(sealed.ciphertext),
      );
      return new TextDecoder().decode(data);
    },
  };
}
