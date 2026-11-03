// A person's OAuth consent for a delegated connector (docs/sdk.md section 10): the platform sends
// the person to the provider, keeps the tokens sealed in the registry, refreshes them, and hands
// the access token to the connector's session. Neutral (WebCrypto and `fetch` only).
import type { RegisteredEnvironment, Registry } from "./registry";
import type { SecretBox } from "./secret-box";

/** One identity provider's OAuth client, as the platform registered it. */
export interface OAuthProvider {
  authorizeUrl: string;
  tokenUrl: string;
  clientId: string;
  /** Held in the platform's secrets, never in a tool. */
  clientSecret: string;
  redirectUri: string;
}

/** The part of `fetch` the exchange needs. */
export type ConsentFetch = (
  url: string,
  init: { method: string; headers: Record<string, string>; body: string },
) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;

export interface ConsentOptions {
  registry: Registry;
  /** Seals the `state` parameter; the registry's own box works. */
  box: SecretBox;
  /** By connector type: `"microsoft-365"`. */
  providers: Record<string, OAuthProvider>;
  fetch: ConsentFetch;
  now?: () => Date;
  /** How long a person has to come back from the provider, in seconds. 600 by default. */
  stateTtl?: number;
}

export interface ConsentTarget {
  toolId: string;
  environment: RegisteredEnvironment;
  userId: string;
  connector: string;
}

export type ConsentErrorCode =
  | "CONSENT_REQUIRED"
  | "UNKNOWN_CONNECTOR"
  | "INVALID_STATE"
  | "PROVIDER_REFUSED";

export class ConsentError extends Error {
  override name = "ConsentError";
  readonly code: ConsentErrorCode;
  constructor(code: ConsentErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

interface StatePayload extends ConsentTarget {
  scopes: string[];
  verifier: string;
  expires: number;
}

const STATE_SLOT = "consent-state";
const REFRESH_MARGIN_MS = 60_000;

const base64url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

interface TokenReply {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
}

export function createConsent(options: ConsentOptions) {
  const now = () => (options.now?.() ?? new Date()).getTime();
  const ttl = (options.stateTtl ?? 600) * 1000;

  const provider = (connector: string): OAuthProvider => {
    const found = options.providers[connector];
    if (!found) throw new ConsentError("UNKNOWN_CONNECTOR", `No OAuth client for "${connector}".`);
    return found;
  };

  async function token(p: OAuthProvider, form: Record<string, string>): Promise<TokenReply> {
    const response = await options.fetch(p.tokenUrl, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        ...form,
        client_id: p.clientId,
        client_secret: p.clientSecret,
      }).toString(),
    });
    const body = (await response.json()) as TokenReply;
    if (!response.ok || !body.access_token) {
      throw new ConsentError("PROVIDER_REFUSED", `The provider answered ${response.status}.`);
    }
    return body;
  }

  const expiry = (reply: TokenReply) =>
    reply.expires_in === undefined
      ? undefined
      : new Date(now() + reply.expires_in * 1000).toISOString();

  return {
    /** The address to send the person to, and the sealed `state` the provider hands back. */
    async start(input: ConsentTarget & { scopes: string[] }): Promise<{ url: string }> {
      const p = provider(input.connector);
      const verifier = base64url(crypto.getRandomValues(new Uint8Array(32)));
      const challenge = base64url(
        new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier))),
      );
      const payload: StatePayload = { ...input, verifier, expires: now() + ttl };
      const sealed = await options.box.seal(STATE_SLOT, JSON.stringify(payload));
      const url = new URL(p.authorizeUrl);
      url.search = new URLSearchParams({
        response_type: "code",
        client_id: p.clientId,
        redirect_uri: p.redirectUri,
        scope: input.scopes.join(" "),
        state: `${sealed.iv}.${sealed.ciphertext}`,
        code_challenge: challenge,
        code_challenge_method: "S256",
      }).toString();
      return { url: url.toString() };
    },

    /** The person is back from the provider: swaps the code for tokens and keeps them. */
    async complete(input: { state: string; code: string }): Promise<ConsentTarget> {
      const [iv, ciphertext] = input.state.split(".");
      let payload: StatePayload;
      try {
        payload = JSON.parse(
          await options.box.open(STATE_SLOT, { iv: iv ?? "", ciphertext: ciphertext ?? "" }),
        ) as StatePayload;
      } catch {
        throw new ConsentError("INVALID_STATE", "The consent state is not valid.");
      }
      if (payload.expires < now()) {
        throw new ConsentError("INVALID_STATE", "The consent request has expired.");
      }
      const p = provider(payload.connector);
      const reply = await token(p, {
        grant_type: "authorization_code",
        code: input.code,
        redirect_uri: p.redirectUri,
        code_verifier: payload.verifier,
      });
      const target = {
        toolId: payload.toolId,
        environment: payload.environment,
        userId: payload.userId,
        connector: payload.connector,
      };
      const expiresAt = expiry(reply);
      await options.registry.saveConnection({
        ...target,
        scopes: payload.scopes,
        tokens: {
          accessToken: reply.access_token!,
          ...(reply.refresh_token ? { refreshToken: reply.refresh_token } : {}),
        },
        ...(expiresAt ? { expiresAt } : {}),
      });
      return target;
    },

    /**
     * The access token for a person's call, refreshed when it is about to expire. Throws
     * `CONSENT_REQUIRED` when the person has not consented, has been revoked, or the provider no
     * longer honors the refresh token: the caller then sends them through `start`.
     */
    async accessToken(target: ConsentTarget): Promise<string> {
      const connection = await options.registry.readConnection(target);
      if (!connection) throw new ConsentError("CONSENT_REQUIRED", "The person has not consented.");
      const stale =
        connection.expiresAt !== undefined &&
        Date.parse(connection.expiresAt) - now() < REFRESH_MARGIN_MS;
      if (!stale) return connection.accessToken;
      if (!connection.refreshToken) {
        await options.registry.revokeConnection(target);
        throw new ConsentError("CONSENT_REQUIRED", "The consent has expired.");
      }
      try {
        const reply = await token(provider(target.connector), {
          grant_type: "refresh_token",
          refresh_token: connection.refreshToken,
        });
        const expiresAt = expiry(reply);
        await options.registry.saveConnection({
          ...target,
          scopes: connection.scopes,
          tokens: {
            accessToken: reply.access_token!,
            refreshToken: reply.refresh_token ?? connection.refreshToken,
          },
          ...(expiresAt ? { expiresAt } : {}),
        });
        return reply.access_token!;
      } catch (error) {
        if (error instanceof ConsentError && error.code === "PROVIDER_REFUSED") {
          await options.registry.revokeConnection(target);
          throw new ConsentError("CONSENT_REQUIRED", "The provider refused to renew the consent.");
        }
        throw error;
      }
    },
  };
}

export type Consent = ReturnType<typeof createConsent>;
