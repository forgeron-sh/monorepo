import {
  createCloudflareClient,
  createRestD1,
  GATEWAY_COMPATIBILITY_DATE,
  GATEWAY_COMPATIBILITY_FLAGS,
  type CloudflareClient,
} from "@forgeron/hosting";
import { migratePlatform } from "@forgeron/registry";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parseArgs } from "node:util";
import { UsageError, type Io } from "../io";
import { resolveCloudflareCredential } from "./cloudflare-auth";
import { readAssets, uploadAssets } from "./console-assets";

// `forgeron platform install` (docs/ARCHITECTURE.md, "Installing the platform in self-host"):
// creates the platform D1 and migrates it, then deploys the gateway Worker on the customer's
// Cloudflare account with the D1 and the API token bound as a secret.
//
// The credential comes from `--auth` (cloudflare-auth.ts): `token` (default) reads
// `CLOUDFLARE_API_TOKEN`, `wrangler` takes the token of the wrangler session. It is never an
// argument (it would land in the shell history) and never printed. The gateway's secret binding
// is only ever an API token; see D-026.

const USAGE =
  "Usage: forgeron platform install --account <id> --domain <base-domain> --gateway <worker.js> [--console <dir>] [--name forgeron] [--auth token|wrangler]";

interface Named {
  uuid?: string;
}

export interface PlatformOptions {
  /** The `fetch` used for the Cloudflare API: tests hand over a simulated account. */
  fetch?: typeof fetch;
}

const base64 = (text: string) => {
  let binary = "";
  for (const byte of new TextEncoder().encode(text)) binary += String.fromCharCode(byte);
  return btoa(binary);
};

export async function platform(
  args: string[],
  io: Io,
  options: PlatformOptions = {},
): Promise<number> {
  const [sub, ...rest] = args;
  if (sub !== "install") throw new UsageError(USAGE);
  const { values, positionals } = parseArgs({
    args: rest,
    allowPositionals: true,
    options: {
      account: { type: "string" },
      domain: { type: "string" },
      gateway: { type: "string" },
      console: { type: "string" },
      name: { type: "string", default: "forgeron" },
      auth: { type: "string", default: "token" },
    },
  });
  if (positionals.length > 0 || !values.account || !values.domain || !values.gateway) {
    throw new UsageError(USAGE);
  }
  const name = values.name as string;
  if (!/^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/.test(name)) {
    throw new UsageError(`"${name}" is not a usable name: 3 to 40 characters among a-z, 0-9, "-".`);
  }
  const { installToken: apiToken, gatewayToken } = await resolveCloudflareCredential(
    values.auth as string,
    io,
  );
  let code: string;
  try {
    code = await readFile(resolve(io.cwd, values.gateway), "utf8");
  } catch {
    throw new UsageError(`Cannot read the gateway bundle ${values.gateway}.`);
  }

  const assets = values.console ? await readAssets(resolve(io.cwd, values.console)) : undefined;

  const client: CloudflareClient = createCloudflareClient({
    accountId: values.account,
    apiToken,
    ...(options.fetch ? { fetch: options.fetch } : {}),
  });

  // 1. The platform D1: reused when it exists, so that the command can be run again.
  const database = `${name}-platform`;
  const existing = await client.request<Array<Named & { name?: string }>>(
    "GET",
    `/d1/database?name=${encodeURIComponent(database)}`,
  );
  const found = existing.find((d) => d.name === database);
  const databaseId =
    found?.uuid ?? (await client.request<Named>("POST", "/d1/database", { name: database })).uuid;
  if (!databaseId) throw new Error("Cloudflare did not return the id of the platform D1.");
  io.log(`${found ? "Found" : "Created"} the platform D1 "${database}".`);

  // 2. Its schema.
  const { applied } = await migratePlatform(createRestD1(client, databaseId));
  io.log(applied.length ? `Applied: ${applied.join(", ")}` : "The platform D1 is up to date.");

  // 3. The gateway Worker, with the D1 and, as a secret, the token it will deploy tools with.
  const worker = `${name}-gateway`;
  try {
    await client.request("GET", `/workers/workers/${worker}`);
  } catch (error) {
    if ((error as { status?: number }).status !== 404) throw error;
    await client.request("POST", "/workers/workers", { name: worker });
  }
  const assetsJwt = assets ? await uploadAssets(client, worker, assets) : undefined;
  const version = await client.request<{ id: string }>(
    "POST",
    `/workers/workers/${worker}/versions`,
    {
      main_module: "worker.js",
      compatibility_date: GATEWAY_COMPATIBILITY_DATE,
      compatibility_flags: [...GATEWAY_COMPATIBILITY_FLAGS],
      modules: [
        {
          name: "worker.js",
          content_type: "application/javascript+module",
          content_base64: base64(code),
        },
      ],
      // The console, served by the gateway at the workspace origin (apps/gateway/wrangler.jsonc).
      ...(assetsJwt
        ? {
            assets: {
              jwt: assetsJwt,
              config: { not_found_handling: "single-page-application", run_worker_first: true },
            },
          }
        : {}),
      bindings: [
        ...(assetsJwt ? [{ type: "assets", name: "ASSETS" }] : []),
        { type: "d1", name: "DB", id: databaseId },
        { type: "plain_text", name: "BASE_DOMAIN", text: values.domain },
        { type: "plain_text", name: "CLOUDFLARE_ACCOUNT_ID", text: values.account },
        ...(gatewayToken
          ? [{ type: "secret_text", name: "CLOUDFLARE_API_TOKEN", text: gatewayToken }]
          : []),
      ],
    },
  );
  await client.request("POST", `/workers/scripts/${worker}/deployments`, {
    strategy: "percentage",
    versions: [{ percentage: 100, version_id: version.id }],
  });
  if (gatewayToken) {
    io.log(`Deployed the gateway "${worker}" (the API token is stored as its secret).`);
  } else {
    io.log(`Deployed the gateway "${worker}" WITHOUT a CLOUDFLARE_API_TOKEN secret.`);
    io.log(
      "The wrangler token is a short-lived session token and is not stored. Create an API token limited to Workers, D1, KV and R2, then either run the install again with GATEWAY_CLOUDFLARE_API_TOKEN set, or set the secret CLOUDFLARE_API_TOKEN on the gateway Worker yourself (for example with `wrangler secret put`). Tools cannot be deployed before that.",
    );
  }

  // 4. DNS and route: a proxied wildcard record, then `*.<domain>/*` to the gateway.
  await attachRoute(client, values.domain, worker, io);
  io.log(
    assets
      ? `Deployed the console (${assets.length} files) as assets of the gateway.`
      : "The console is not deployed: pass --console <dir> (the build of apps/console) to deploy it.",
  );
  return 0;
}

interface Zone {
  id: string;
  name: string;
}

// Zone, proxied wildcard record and route, each created only when missing so that a second run
// changes nothing. Cloudflare needs a proxied record for a route to be reached; with no origin the
// record is the documented placeholder `AAAA 100::` (Workers best practices, "Routes").
async function attachRoute(client: CloudflareClient, domain: string, worker: string, io: Io) {
  const zones = await client.requestRoot<Zone[]>(
    "GET",
    `/zones?name=${encodeURIComponent(domain)}&account.id=${encodeURIComponent(client.accountId)}`,
  );
  const zone = zones.find((z) => z.name === domain);
  if (!zone) {
    throw new UsageError(
      `The zone "${domain}" is not on this Cloudflare account (or the token cannot read zones). Add the domain to the account first, or pass the --domain of a zone it holds.`,
    );
  }
  const wildcard = `*.${domain}`;
  const records = await client.requestRoot<Array<{ name: string; proxied?: boolean }>>(
    "GET",
    `/zones/${zone.id}/dns_records?name=${encodeURIComponent(wildcard)}`,
  );
  if (records.length > 0) {
    io.log(
      `Found the DNS record "${wildcard}"${records[0]!.proxied ? "" : " (not proxied: routes need a proxied record)"}.`,
    );
  } else {
    await client.requestRoot("POST", `/zones/${zone.id}/dns_records`, {
      type: "AAAA",
      name: wildcard,
      content: "100::",
      proxied: true,
      comment: "Forgeron gateway (placeholder origin: the Worker route answers)",
    });
    io.log(`Created the proxied DNS record "${wildcard}".`);
  }
  const pattern = `${wildcard}/*`;
  const routes = await client.requestRoot<Array<{ id: string; pattern: string; script?: string }>>(
    "GET",
    `/zones/${zone.id}/workers/routes`,
  );
  const route = routes.find((r) => r.pattern === pattern);
  if (route && route.script !== worker) {
    throw new UsageError(
      `The route "${pattern}" already points to "${route.script ?? "no Worker"}", not "${worker}". Remove or change it, then run the install again.`,
    );
  }
  if (route) {
    io.log(`Found the route "${pattern}" to "${worker}".`);
  } else {
    await client.requestRoot("POST", `/zones/${zone.id}/workers/routes`, {
      pattern,
      script: worker,
    });
    io.log(`Created the route "${pattern}" to "${worker}".`);
  }
}
