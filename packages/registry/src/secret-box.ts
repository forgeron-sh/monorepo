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
  /**
   * The value sealed again under the current key (D-108): `undefined` when it already is. Throws when no
   * key opens it. Nothing is sealed under a previous key.
   */
  reseal(slot: string, sealed: SealedSecret): Promise<SealedSecret | undefined>;
}

const b64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const unb64 = (text: string) => Uint8Array.from(atob(text), (c) => c.charCodeAt(0));

const importKey = async (key: string) => {
  const raw = unb64(key);
  if (raw.length !== 32) throw new Error("The secret key must be 32 bytes, base64-encoded.");
  return crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"]);
};

/**
 * `key` is 32 random bytes, base64: the platform's master key, held in the gateway's secrets.
 * `previous` are the keys it replaced (`SECRETS_KEY_PREVIOUS`, D-100): a value sealed under one of
 * them still opens, nothing is sealed with them, and a value sealed again goes under `key`.
 */
export async function createSecretBox(key: string, previous: string[] = []): Promise<SecretBox> {
  const cryptoKey = await importKey(key);
  const olderKeys = await Promise.all(previous.map(importKey));
  const aad = (slot: string) => new TextEncoder().encode(slot);
  const seal = async (slot: string, value: string): Promise<SealedSecret> => {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const data = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv, additionalData: aad(slot) },
      cryptoKey,
      new TextEncoder().encode(value),
    );
    return { iv: b64(iv), ciphertext: b64(new Uint8Array(data)) };
  };
  const opens = (
    candidate: Awaited<ReturnType<typeof importKey>>,
    slot: string,
    sealed: SealedSecret,
  ) =>
    crypto.subtle.decrypt(
      { name: "AES-GCM", iv: unb64(sealed.iv), additionalData: aad(slot) },
      candidate,
      unb64(sealed.ciphertext),
    );
  return {
    seal,
    async reseal(slot, sealed) {
      try {
        await opens(cryptoKey, slot, sealed);
        return undefined;
      } catch {
        // Not under the current key: one of the previous ones must open it, or this throws.
      }
      let failure: unknown;
      for (const candidate of olderKeys) {
        try {
          return await seal(slot, new TextDecoder().decode(await opens(candidate, slot, sealed)));
        } catch (error) {
          failure ??= error;
        }
      }
      throw failure ?? new Error("No key opens this value.");
    },
    async open(slot, sealed) {
      // The current key first; a failure of its authentication tag is the only reason to try another.
      let failure: unknown;
      for (const candidate of [cryptoKey, ...olderKeys]) {
        try {
          const data = await crypto.subtle.decrypt(
            { name: "AES-GCM", iv: unb64(sealed.iv), additionalData: aad(slot) },
            candidate,
            unb64(sealed.ciphertext),
          );
          return new TextDecoder().decode(data);
        } catch (error) {
          failure ??= error;
        }
      }
      throw failure;
    },
  };
}
