import {
  createCloudflareClient,
  createRestD1,
  GATEWAY_ASSETS_CONFIG,
  GATEWAY_COMPATIBILITY_DATE,
  GATEWAY_COMPATIBILITY_FLAGS,
  serviceBindingName,
  uploadAssets,
  workerName,
  type CloudflareClient,
} from "@forgeron/hosting";
import { migratePlatform, saveGatewayAssets, saveGatewayCode } from "@forgeron/registry";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parseArgs } from "node:util";
import { UsageError, type Io } from "../io";
import { resolveCloudflareCredential } from "./cloudflare-auth";
import { identitySettings, KEYS, settingBindings, type IdentityFlags } from "./gateway-identity";
import { readAssets } from "./console-assets";
import { platformStatus, STATUS_USAGE } from "./platform-status";

// `forgeron platform install` (docs/ARCHITECTURE.md, "Installing the platform in self-host"):
// creates the platform D1 and migrates it, then deploys the gateway Worker on the customer's
// Cloudflare account with the D1 and the API token bound as a secret.
//
// The credential comes from `--auth` (cloudflare-auth.ts): `token` (default) reads
// `CLOUDFLARE_API_TOKEN`, `wrangler` takes the token of the wrangler session. It is never an
// argument (it would land in the shell history) and never printed. The gateway's secret binding
// is only ever an API token; see D-026.

const USAGE =
  "Usage: forgeron platform install --account <id> --domain <base-domain> --gateway <worker.js> [--console <dir>] [--oidc-issuer <url> --oidc-client-id <id> [--admin-email <email>] [--member-email-domains <d1,d2>]] [--sign-in email[,oidc] [--mail-from <address> | --mail console]] [--name forgeron] [--auth token|wrangler]";

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
  if (sub === "status") return platformStatus(rest, io, options);
  if (sub !== "install") throw new UsageError(`${USAGE}\n       ${STATUS_USAGE}`);
  const { values, positionals } = parseArgs({
    args: rest,
    allowPositionals: true,
    options: {
      account: { type: "string" },
      domain: { type: "string" },
      gateway: { type: "string" },
      console: { type: "string" },
      "oidc-issuer": { type: "string" },
      "oidc-client-id": { type: "string" },
      "admin-email": { type: "string" },
      "member-email-domains": { type: "string" },
      "sign-in": { type: "string" },
      "mail-from": { type: "string" },
      mail: { type: "string" },
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

  const flags: IdentityFlags = {
    ...(values["oidc-issuer"] !== undefined ? { issuer: values["oidc-issuer"] } : {}),
    ...(values["oidc-client-id"] !== undefined ? { clientId: values["oidc-client-id"] } : {}),
    ...(values["admin-email"] !== undefined ? { adminEmail: values["admin-email"] } : {}),
    ...(values["sign-in"] !== undefined ? { signIn: values["sign-in"] } : {}),
    ...(values.mail !== undefined ? { mail: values.mail } : {}),
    ...(values["mail-from"] !== undefined ? { mailFrom: values["mail-from"] } : {}),
    ...(values["member-email-domains"] !== undefined
      ? { memberDomains: values["member-email-domains"] }
      : {}),
  };
  if (flags.mail === "console" && /(^|\.)forgeron\.app$/.test(values.domain)) {
    throw new UsageError("--mail console is for test installs: not on the forgeron.app cloud.");
  }
  const settings = identitySettings(flags, process.env);
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
  const platformD1 = createRestD1(client, databaseId);
  const { applied } = await migratePlatform(platformD1);
  io.log(applied.length ? `Applied: ${applied.join(", ")}` : "The platform D1 is up to date.");
  // The gateway uploads a new version of itself when a tool is bound (D-032): it keeps its code here.
  await saveGatewayCode(platformD1, code);
  // Cloudflare does not carry the console over to a new version: the gateway uploads it again, from here.
  if (assets) await saveGatewayAssets(platformD1, assets);

  // 3. The gateway Worker, with the D1 and, as a secret, the token it will deploy tools with.
  const worker = `${name}-gateway`;
  let existed = true;
  try {
    await client.request("GET", `/workers/workers/${worker}`);
  } catch (error) {
    if ((error as { status?: number }).status !== 404) throw error;
    await client.request("POST", "/workers/workers", { name: worker });
    existed = false;
  }
  const assetsJwt = assets ? await uploadAssets(client, worker, assets) : undefined;
  // The tool Workers already bound to the gateway: the registry knows each environment, so it
  // knows the `TOOL_<WORKER>` bindings of the version being replaced; each is carried over.
  const bound = existed ? await toolBindings(platformD1) : [];
  const upload = (lost: ReadonlySet<string>) =>
    client.request<{ id: string }>("POST", `/workers/workers/${worker}/versions`, {
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
              config: GATEWAY_ASSETS_CONFIG,
            },
          }
        : {}),
      bindings: [
        ...(assetsJwt ? [{ type: "assets", name: "ASSETS" }] : []),
        { type: "d1", name: "DB", id: databaseId },
        { type: "plain_text", name: "BASE_DOMAIN", text: values.domain },
        { type: "plain_text", name: "CLOUDFLARE_ACCOUNT_ID", text: values.account },
        // The gateway's own name, to upload new versions of itself (D-032).
        { type: "plain_text", name: "GATEWAY_WORKER", text: worker },
        ...(gatewayToken
          ? [{ type: "secret_text", name: "CLOUDFLARE_API_TOKEN", text: gatewayToken }]
          : // Run again without a token to give: the one the gateway already holds is kept, as the keys
            // are. Without this the new version would drop it and tools could no longer be deployed.
            existed && !lost.has(TOKEN_BINDING)
            ? [{ type: "inherit", name: TOKEN_BINDING }]
            : []),
        ...settingBindings(settings, existed, lost),
        ...bound.filter((n) => !lost.has(n)).map((n) => ({ type: "inherit", name: n })),
      ],
    });
  // Keys and identity settings of an earlier version are kept (`inherit`); when Cloudflare cannot
  // supply one (error 10057 names it), a key is generated and an optional setting is left out.
  let version: { id: string };
  let regenerated = new Set<string>();
  try {
    version = await upload(new Set());
  } catch (error) {
    const message = (error as Error).message;
    const lost = new Set(
      [...settings.map((s) => s.name), ...bound, TOKEN_BINDING].filter((n) => message.includes(n)),
    );
    if (!existed || (error as { status?: number }).status !== 400 || lost.size === 0) throw error;
    regenerated = lost;
    version = await upload(lost);
  }
  await client.request("POST", `/workers/scripts/${worker}/deployments`, {
    strategy: "percentage",
    versions: [{ percentage: 100, version_id: version.id }],
  });
  if (gatewayToken) {
    io.log(`Deployed the gateway "${worker}" (the API token is stored as its secret).`);
  } else if (existed && !regenerated.has(TOKEN_BINDING)) {
    io.log(
      `Deployed the gateway "${worker}"; it keeps the CLOUDFLARE_API_TOKEN secret it already had.`,
    );
  } else {
    io.log(`Deployed the gateway "${worker}" WITHOUT a CLOUDFLARE_API_TOKEN secret.`);
    io.log(
      "The wrangler token is a short-lived session token and is not stored. Create an API token limited to Workers, D1, KV and R2, then either run the install again with GATEWAY_CLOUDFLARE_API_TOKEN set, or set the secret CLOUDFLARE_API_TOKEN on the gateway Worker yourself (for example with `wrangler secret put`). Tools cannot be deployed before that.",
    );
  }

  const dropped = bound.filter((n) => regenerated.has(n));
  if (dropped.length) {
    io.log(
      `Cloudflare could not carry over ${dropped.join(", ")}: those tools are not bound until they are deployed again.`,
    );
  } else if (bound.length) {
    io.log(`Kept the ${bound.length} tool binding(s) of the gateway.`);
  }

  const created = KEYS.filter((k) => !existed || regenerated.has(k));
  io.log(
    created.length
      ? `Generated the gateway keys ${created.join(", ")} (stored as secrets, not shown).`
      : "Kept the gateway's existing keys AUTH_SECRET and SECRETS_KEY.",
  );
  io.log(
    settings.some((s) => s.name === "MAIL_MODE" && s.given)
      ? "Sign-in is configured by email code in TEST mode: the codes are written to the gateway's logs, not mailed (anyone who reads the logs can sign in)."
      : settings.some((s) => s.name === "SEND_EMAIL" && s.given)
        ? settings.some((s) => s.name === "OIDC_ISSUER" && s.given)
          ? "Sign-in is configured by email code and with your OIDC provider (the sender domain must be onboarded to Cloudflare Email Sending)."
          : "Sign-in is configured by email code (the sender domain must be onboarded to Cloudflare Email Sending)."
        : settings.some((s) => s.given)
          ? "Sign-in is configured with your OIDC provider."
          : existed
            ? "No identity flag given: the sign-in settings of the previous version are kept, if there were any."
            : "Sign-in is NOT configured: run the install again with --oidc-issuer and --oidc-client-id, or --sign-in email (docs/self-host.md).",
  );

  // 4. DNS and route: a proxied wildcard record, then `*.<domain>/*` to the gateway.
  await attachRoute(client, values.domain, worker, io);
  io.log(
    assets
      ? `Deployed the console (${assets.length} files) as assets of the gateway.`
      : "The console is not deployed: pass --console <dir> (the build of apps/console) to deploy it.",
  );
  return 0;
}

const TOKEN_BINDING = "CLOUDFLARE_API_TOKEN";

/** `TOOL_<WORKER>` of every environment the registry holds: those a tool deployment bound. */
async function toolBindings(d1: ReturnType<typeof createRestD1>): Promise<string[]> {
  const { results } = await d1
    .prepare(
      `SELECT t."workspace" AS workspace, t."name" AS tool, e."name" AS environment, e."branch" AS branch FROM "environments" e JOIN "tools" t ON t."id" = e."tool_id"`,
    )
    .all();
  return (
    (results ?? []) as Array<{
      workspace: string;
      tool: string;
      environment: string;
      branch: string;
    }>
  ).map((row) =>
    serviceBindingName(
      workerName(row.workspace, {
        tool: row.tool,
        name: row.environment as "preview" | "production",
        ...(row.branch ? { branch: row.branch } : {}),
      }),
    ),
  );
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
