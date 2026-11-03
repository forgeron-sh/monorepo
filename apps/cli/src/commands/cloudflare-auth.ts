import { UsageError, type Io } from "../io";

// How `forgeron platform install` obtains its Cloudflare credential (docs/ARCHITECTURE.md,
// "Installing the platform in self-host"; D-026). A provider returns two tokens: the one the
// installation itself calls Cloudflare with, and the one stored as the gateway's secret binding
// (absent when it cannot be stored honestly). Neither is ever printed or put in an error.

export interface CloudflareCredential {
  /** Used for the Cloudflare API calls of the installation only. */
  installToken: string;
  /** Stored as the gateway's `CLOUDFLARE_API_TOKEN` secret; absent: the binding is skipped. */
  gatewayToken?: string;
}

interface Provider {
  resolve(io: Io, env: NodeJS.ProcessEnv): Promise<CloudflareCredential>;
}

const tokenProvider: Provider = {
  async resolve(_io, env) {
    const token = env.CLOUDFLARE_API_TOKEN;
    if (!token) {
      throw new UsageError(
        "Set CLOUDFLARE_API_TOKEN to a token limited to Workers, D1, KV and R2 (it is never an argument), or use --auth wrangler.",
      );
    }
    return { installToken: token, gatewayToken: token };
  },
};

/** The OAuth access token of the wrangler session: short-lived, so never the gateway's secret. */
const wranglerProvider: Provider = {
  async resolve(io, env) {
    const notLoggedIn = new UsageError(
      "Could not get a token from wrangler. Install wrangler and run `wrangler login`, then try again.",
    );
    if (!io.capture) throw notLoggedIn;
    let result: { code: number; stdout: string };
    try {
      result = await io.capture("wrangler", ["auth", "token"], io.cwd);
    } catch {
      throw notLoggedIn;
    }
    const lines = result.stdout
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    if (result.code !== 0 || lines.length !== 1) throw notLoggedIn;
    return {
      installToken: lines[0]!,
      ...(env.GATEWAY_CLOUDFLARE_API_TOKEN
        ? { gatewayToken: env.GATEWAY_CLOUDFLARE_API_TOKEN }
        : {}),
    };
  },
};

const reserved: Provider = {
  async resolve() {
    throw new UsageError(
      "--auth oauth is planned, not available: a Forgeron OAuth client for Cloudflare does not exist yet.",
    );
  },
};

const providers: Record<string, Provider> = {
  token: tokenProvider,
  wrangler: wranglerProvider,
  oauth: reserved,
};

const AUTH_NAMES = Object.keys(providers);

export function resolveCloudflareCredential(
  name: string,
  io: Io,
  env: NodeJS.ProcessEnv = process.env,
): Promise<CloudflareCredential> {
  const provider = Object.hasOwn(providers, name) ? providers[name] : undefined;
  if (!provider) {
    throw new UsageError(`Unknown --auth "${name}": use ${AUTH_NAMES.join(", ")}.`);
  }
  return provider.resolve(io, env);
}
