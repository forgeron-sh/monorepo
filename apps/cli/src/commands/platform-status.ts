import { checkMigrations, createCloudflareClient, createRestD1 } from "@forgeron/hosting";
import { platformMigrations } from "@forgeron/registry";
import { parseArgs } from "node:util";
import { UsageError, type Io } from "../io";
import { resolveCloudflareCredential } from "./cloudflare-auth";

// `forgeron platform status` (D-112): what is installed on the Cloudflare account, read only, in the
// manner of `wrangler`'s own listings. It answers what an operator asks before and after an install: is
// the platform database migrated, which bindings does the gateway hold, does the route answer. It never
// prints a secret: a secret binding shows its name only, and no value is ever read.

export const STATUS_USAGE =
  "Usage: forgeron platform status --account <id> --domain <base-domain> [--name forgeron] [--auth token|wrangler]";

/** The bindings a working gateway holds, and what each is for. */
const EXPECTED: Record<string, string> = {
  DB: "the platform database",
  BASE_DOMAIN: "the domain the gateway serves",
  CLOUDFLARE_ACCOUNT_ID: "the account tools are deployed to",
  GATEWAY_WORKER: "the gateway's own name (it uploads new versions of itself)",
  CLOUDFLARE_API_TOKEN: "the token tools are deployed with",
  AUTH_SECRET: "signs sessions and tokens",
  SECRETS_KEY: "seals stored secrets",
};
/** Plain values that are safe and useful to print: no secret, no credential. */
const SHOWN = new Set([
  "BASE_DOMAIN",
  "CLOUDFLARE_ACCOUNT_ID",
  "GATEWAY_WORKER",
  "SIGN_IN_METHODS",
  "MAIL_MODE",
  "MAIL_FROM",
  "ADMIN_EMAIL",
  "MEMBER_EMAIL_DOMAINS",
  "OIDC_ISSUER",
  "OIDC_CLIENT_ID",
]);

interface Binding {
  type: string;
  name: string;
  text?: string;
}

export async function platformStatus(
  args: string[],
  io: Io,
  options: { fetch?: typeof fetch } = {},
): Promise<number> {
  const { values, positionals } = parseArgs({
    args,
    allowPositionals: true,
    options: {
      account: { type: "string" },
      domain: { type: "string" },
      name: { type: "string", default: "forgeron" },
      auth: { type: "string", default: "token" },
    },
  });
  if (positionals.length > 0 || !values.account || !values.domain) {
    throw new UsageError(STATUS_USAGE);
  }
  const name = values.name as string;
  const { installToken } = await resolveCloudflareCredential(values.auth as string, io);
  const client = createCloudflareClient({
    accountId: values.account,
    apiToken: installToken,
    ...(options.fetch ? { fetch: options.fetch } : {}),
  });
  let problems = 0;
  const problem = (message: string) => {
    problems += 1;
    io.log(`  ! ${message}`);
  };

  // The platform database and its schema.
  const database = `${name}-platform`;
  io.log(`Platform database ${database}`);
  const found = (
    await client.request<Array<{ uuid?: string; name?: string }>>(
      "GET",
      `/d1/database?name=${encodeURIComponent(database)}`,
    )
  ).find((d) => d.name === database);
  if (!found?.uuid) {
    problem("not found: run `forgeron platform install`.");
  } else {
    const check = await checkMigrations(createRestD1(client, found.uuid), platformMigrations);
    io.log(`  ${check.applied.length} migration${check.applied.length === 1 ? "" : "s"} applied`);
    if (check.pending.length > 0) {
      problem(
        `${check.pending.length} pending (${check.pending.join(", ")}): run the install again.`,
      );
    }
    for (const c of check.conflicts) problem(`${c.code} ${c.migration}: ${c.message}`);
  }

  // The gateway Worker and what is bound to it.
  const worker = `${name}-gateway`;
  io.log(`Gateway ${worker}`);
  let bindings: Binding[] = [];
  try {
    bindings =
      (await client.request<{ bindings?: Binding[] }>("GET", `/workers/scripts/${worker}/settings`))
        .bindings ?? [];
  } catch (error) {
    if ((error as { status?: number }).status === 404) {
      problem("not deployed: run `forgeron platform install`.");
    } else {
      throw error;
    }
  }
  if (bindings.length > 0) {
    const have = new Set(bindings.map((b) => b.name));
    for (const b of [...bindings].sort((a, z) => a.name.localeCompare(z.name))) {
      const value = b.type === "plain_text" && SHOWN.has(b.name) ? `  ${b.text ?? ""}` : "";
      io.log(`  ${b.type.padEnd(11)} ${b.name}${value}`);
    }
    for (const [binding, purpose] of Object.entries(EXPECTED)) {
      if (!have.has(binding)) problem(`${binding} is missing (${purpose}).`);
    }
    // The console is optional: a gateway installed without `--console` serves the API only.
    if (!have.has("ASSETS"))
      io.log("  note: no console is deployed (pass --console to the install).");
    const tools = bindings.filter((b) => b.name.startsWith("TOOL_")).length;
    io.log(`  ${tools} tool environment${tools === 1 ? "" : "s"} bound`);
  }

  // The route that sends the traffic to it.
  io.log(`Route *.${values.domain}/*`);
  try {
    const zones = await client.requestRoot<Array<{ id: string; name: string }>>(
      "GET",
      `/zones?name=${encodeURIComponent(values.domain)}&account.id=${encodeURIComponent(values.account)}`,
    );
    const zone = zones.find((z) => z.name === values.domain);
    if (!zone) {
      problem(`the zone ${values.domain} is not on this account (or the token cannot read zones).`);
    } else {
      const routes = await client.requestRoot<Array<{ pattern: string; script?: string }>>(
        "GET",
        `/zones/${zone.id}/workers/routes`,
      );
      const route = routes.find((r) => r.pattern === `*.${values.domain}/*`);
      if (!route) problem("no route: run `forgeron platform install`.");
      else if (route.script !== worker)
        problem(`it points to ${route.script ?? "no Worker"}, not ${worker}.`);
      else io.log(`  to ${worker}`);
    }
  } catch (error) {
    problem(`could not read the route: ${(error as Error).message.split("\n")[0]}`);
  }

  io.log(
    problems === 0 ? "Everything is in place." : `${problems} problem${problems === 1 ? "" : "s"}.`,
  );
  return problems === 0 ? 0 : 1;
}
