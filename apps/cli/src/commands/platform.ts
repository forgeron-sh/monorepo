import { createCloudflareClient, createRestD1, type CloudflareClient } from "@forgeron/hosting";
import { migratePlatform } from "@forgeron/registry";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parseArgs } from "node:util";
import { UsageError, type Io } from "../io";

// `forgeron platform install` (docs/ARCHITECTURE.md, "Installing the platform in self-host"):
// creates the platform D1 and migrates it, then deploys the gateway Worker on the customer's
// Cloudflare account with the D1 and the API token bound as a secret.
//
// The token is read from `CLOUDFLARE_API_TOKEN` only (never an argument, which would land in the
// shell history), is sent to Cloudflare as a secret binding of the gateway, and is never printed.
// It is the most sensitive secret of the installation: limit it to Workers, D1, KV and R2.

const USAGE =
  "Usage: forgeron platform install --account <id> --domain <base-domain> --gateway <worker.js> [--name forgeron]";
const COMPATIBILITY_DATE = "2026-10-01";

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
      name: { type: "string", default: "forgeron" },
    },
  });
  if (positionals.length > 0 || !values.account || !values.domain || !values.gateway) {
    throw new UsageError(USAGE);
  }
  const name = values.name as string;
  if (!/^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/.test(name)) {
    throw new UsageError(`"${name}" is not a usable name: 3 to 40 characters among a-z, 0-9, "-".`);
  }
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  if (!apiToken) {
    throw new UsageError(
      "Set CLOUDFLARE_API_TOKEN to a token limited to Workers, D1, KV and R2 (it is never an argument).",
    );
  }
  let code: string;
  try {
    code = await readFile(resolve(io.cwd, values.gateway), "utf8");
  } catch {
    throw new UsageError(`Cannot read the gateway bundle ${values.gateway}.`);
  }

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
  const version = await client.request<{ id: string }>(
    "POST",
    `/workers/workers/${worker}/versions`,
    {
      main_module: "worker.js",
      compatibility_date: COMPATIBILITY_DATE,
      compatibility_flags: ["nodejs_compat"],
      modules: [
        {
          name: "worker.js",
          content_type: "application/javascript+module",
          content_base64: base64(code),
        },
      ],
      bindings: [
        { type: "d1", name: "DB", id: databaseId },
        { type: "plain_text", name: "BASE_DOMAIN", text: values.domain },
        { type: "plain_text", name: "CLOUDFLARE_ACCOUNT_ID", text: values.account },
        { type: "secret_text", name: "CLOUDFLARE_API_TOKEN", text: apiToken },
      ],
    },
  );
  await client.request("POST", `/workers/scripts/${worker}/deployments`, {
    strategy: "percentage",
    versions: [{ percentage: 100, version_id: version.id }],
  });
  io.log(`Deployed the gateway "${worker}" (the API token is stored as its secret).`);
  io.log("The console is not deployed: no console build exists yet.");
  return 0;
}
