import type { D1Database } from "@forgeron/hosting";
import { loadGatewayAssets, loadGatewayCode } from "@forgeron/registry";
import {
  createCloudflareClient,
  createGatewayBindings,
  GATEWAY_COMPATIBILITY_DATE,
  GATEWAY_COMPATIBILITY_FLAGS,
  type GatewayBindings,
} from "@forgeron/hosting";
import type { SendEmailBinding } from "./mail/mail";
import type { DispatchNamespace } from "./dispatch/targets";

/** What the gateway Worker is given by its configuration (bindings to fill in `wrangler.jsonc`). */
/** The part of a Durable Object namespace the gateway uses (the Workers runtime gives the real one). */
interface DurableObjectNamespaceLike {
  idFromName(name: string): unknown;
  get(id: unknown): { fetch(request: Request): Response | Promise<Response> };
}

export interface GatewayEnv {
  /** The platform D1. */
  DB: D1Database;
  /**
   * `forgeron.app`: `<workspace>.<BASE_DOMAIN>` serves that workspace. Optional in self-host when
   * `WORKSPACE_HOSTS` or `DEFAULT_WORKSPACE` says which hosts are served (D-126).
   */
  BASE_DOMAIN?: string;
  /**
   * Exact hosts and the workspace each serves (D-126): `host=workspace,host=workspace`. A workspace's
   * first host here is its primary origin. Checked before the `BASE_DOMAIN` rule.
   */
  WORKSPACE_HOSTS?: string;
  /**
   * Single-workspace mode (D-126): the workspace that any other host serves, such as the Worker's
   * `workers.dev` address. Unset: an unknown host serves no workspace, as before.
   */
  DEFAULT_WORKSPACE?: string;
  /**
   * Forgeron Cloud: the dispatch namespace the tool Workers are uploaded to (`dispatch_namespaces`
   * in `wrangler.jsonc`). Self-host has none and holds one service binding per Worker instead
   * (`TOOL_<WORKER>`, see `serviceBindingOf`): the gateway holds the only way to a tool.
   */
  DISPATCHER?: DispatchNamespace;
  /**
   * Realtime (D-135): the Durable Object namespace of `RealtimeRoom`, one room per tool channel. Unset: a
   * tool's realtime endpoint answers that it is not enabled on this install, and nothing else changes.
   */
  REALTIME?: DurableObjectNamespaceLike;
  /**
   * The built console (`apps/console/dist`, `assets` in `wrangler.jsonc`). It is the only app code
   * served at the workspace origin (sdk.md §7, "Isolation between tools on the same origin").
   */
  ASSETS?: { fetch(request: Request): Response | Promise<Response> };
  /**
   * Signs sessions, sign-in state and API/CLI/deployment tokens (HMAC). At least 32 random bytes,
   * base64. Secret. Without it nobody can sign in and every call is anonymous.
   */
  AUTH_SECRET?: string;
  /**
   * Rotation (D-035): the keys `AUTH_SECRET` replaced, comma-separated. Tokens they signed stay good
   * until they expire (30 days at most); drop them after that. Secret.
   */
  AUTH_SECRET_PREVIOUS?: string;
  /** Encrypts tool secrets and connection tokens at rest: 32 random bytes, base64. Secret. */
  SECRETS_KEY?: string;
  /**
   * Rotation (D-100): the keys `SECRETS_KEY` replaced, comma-separated. A value sealed under one still
   * opens; nothing is sealed under it. Keep it until every value has been given again. Secret.
   */
  SECRETS_KEY_PREVIOUS?: string;
  /**
   * The identity provider's issuer URL (OIDC, D-019). A provider saved in the platform
   * (`/console-api/api/identity-provider`, D-041) wins over these; with neither, `/auth` answers 404.
   */
  OIDC_ISSUER?: string;
  OIDC_CLIENT_ID?: string;
  /** Secret. Optional: a public client uses PKCE alone. */
  OIDC_CLIENT_SECRET?: string;
  /** The email that joins the team `admin` of a workspace at its first sign-in (D-027). */
  ADMIN_EMAIL?: string;
  /** Comma-separated email domains whose people become members at sign-in, in no team (D-027). */
  MEMBER_EMAIL_DOMAINS?: string;
  /**
   * How people sign in, comma-separated: `email` (D-049, needs `SEND_EMAIL` and `MAIL_FROM`) and/or
   * `oidc`. Unset: OIDC alone, as before. The sign-in page offers them in that order: the OIDC
   * button first, then the email form.
   */
  SIGN_IN_METHODS?: string;
  /** The `send_email` binding of Cloudflare Email Service that carries the sign-in codes. */
  SEND_EMAIL?: SendEmailBinding;
  /** The address the sign-in mail comes from: an address of a domain onboarded to Email Sending. */
  MAIL_FROM?: string;
  /**
   * `console` (D-051): the codes are written to the Worker's logs instead of being mailed, for test
   * installs. Opt-in; refused on the cloud (`DISPATCHER`, or a `forgeron.app` base domain).
   */
  MAIL_MODE?: string;
  /** The Cloudflare account the gateway deploys tools to (`POST /deploy`). */
  CLOUDFLARE_ACCOUNT_ID?: string;
  /** Secret. Limited to Workers, D1, KV and R2; deploys tools without the person present. */
  CLOUDFLARE_API_TOKEN?: string;
  /** Forgeron Cloud: the name of the dispatch namespace `DISPATCHER` is bound to. */
  DISPATCH_NAMESPACE?: string;
  /**
   * The public GitHub repository (`owner/name`) of the official marketplace (D-116): what any admin
   * syncs into the template catalogue `@templates`. Unset: the official catalogue is filled another way.
   */
  OFFICIAL_MARKETPLACE?: string;
  /** The service bindings of self-host, and whatever else the Worker is given. */
  [binding: string]: unknown;
}

/**
 * Self-host: how the gateway adds and removes the `TOOL_<WORKER>` bindings of its own Worker
 * (D-029, D-032). It needs to know its own name (`GATEWAY_WORKER`, set by `platform install`) and
 * holds its code in the platform D1; without either, nothing is bound, as before.
 */
export function gatewayBindingsOf(env: GatewayEnv): GatewayBindings | undefined {
  if (
    typeof env.GATEWAY_WORKER !== "string" ||
    !env.CLOUDFLARE_ACCOUNT_ID ||
    !env.CLOUDFLARE_API_TOKEN
  ) {
    return undefined;
  }
  return createGatewayBindings(
    createCloudflareClient({
      accountId: env.CLOUDFLARE_ACCOUNT_ID,
      apiToken: env.CLOUDFLARE_API_TOKEN,
    }),
    {
      worker: env.GATEWAY_WORKER,
      // Everything the gateway holds now: carried over to the new version (`inherit`).
      bindings: () => Object.keys(env),
      code: async () => {
        const code = await loadGatewayCode(env.DB);
        if (code === undefined) {
          throw new Error(
            "The platform D1 holds no gateway code: run `forgeron platform install` again.",
          );
        }
        return code;
      },
      compatibilityDate: GATEWAY_COMPATIBILITY_DATE,
      compatibilityFlags: GATEWAY_COMPATIBILITY_FLAGS,
      // The console is served as assets (D-052): they are uploaded again with each new version.
      ...(env.ASSETS === undefined
        ? {}
        : {
            assets: async () => {
              const assets = await loadGatewayAssets(env.DB);
              if (assets === undefined) {
                throw new Error(
                  "The platform D1 holds no console assets: run `forgeron platform install` again.",
                );
              }
              return assets;
            },
          }),
    },
  );
}
