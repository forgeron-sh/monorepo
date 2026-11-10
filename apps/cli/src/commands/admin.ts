import { addresses } from "@forgeron/platform-contract/client";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parseArgs } from "node:util";
import { UsageError, type Io } from "../io";
import { consoleClient, consoleRefusal, credentialsOf, toolOf, workspaceOf } from "../remote";

// The platform's admin operations from the terminal (D-113), in the manner of `wrangler`: what the
// console does with a click, a command does with a token. Everything goes through the workspace's own
// routes with the token of `forgeron login`, so the same guards, validation and audit lines apply.
// None of these commands can show a secret's value: no route returns one.

const USAGE = `Usage: forgeron admin <area> <verb> [--endpoint <url>]

  tools list
  approvals list | approve <id> | reject <id>
  members list | invite <email> [--role <name>,...] | roles <id> --set <name>,... | remove <id>
  audit [--limit <n>]
  user-secrets list --tool <name> | revoke --tool <name> --person <id> [--name <SECRET>]
  user-secrets set --tool <name> --person <id> --name <SECRET>     (the value is typed, never an argument)
  reseal                                seal this workspace's stored secrets again under the current key
  revoke-tokens <person-id>             revoke every token of a person, at once

Outside a tool's folder, name the workspace with --endpoint https://<workspace>.<domain> or
FORGERON_ENDPOINT. For any other route of the API: forgeron api <METHOD> <path>.`;

const FLAGS = {
  endpoint: { type: "string" },
  tool: { type: "string" },
  person: { type: "string" },
  name: { type: "string" },
  role: { type: "string" },
  set: { type: "string" },
  limit: { type: "string" },
} as const;

const list = (value: string | undefined) =>
  (value ?? "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);

/** A table of plain columns: the CLI has no table library and needs none. */
function table(io: Io, header: string[], rows: string[][]) {
  if (rows.length === 0) return io.log("Nothing.");
  const all = [header, ...rows];
  const widths = header.map((_, i) => Math.max(...all.map((r) => (r[i] ?? "").length)));
  for (const row of all) {
    io.log(
      row
        .map((cell, i) => cell.padEnd(widths[i]!))
        .join("  ")
        .trimEnd(),
    );
  }
}

/** `forgeron admin ...`. */
export async function admin(args: string[], io: Io): Promise<number> {
  const { values, positionals } = parseArgs({ args, allowPositionals: true, options: FLAGS });
  const [area, verb, ...rest] = positionals;
  if (!area) throw new UsageError(USAGE);

  const { endpoint, project } = await workspaceOf(io, values.endpoint);
  const client = consoleClient(endpoint, await credentialsOf(io));
  const refused = (answer: { status: number; body: unknown }) => {
    io.error(consoleRefusal(answer));
    return 1;
  };
  const one = (what: string) => {
    if (rest.length !== 1 || !rest[0]) throw new UsageError(`${USAGE}\n\nforgeron admin: ${what}.`);
    return rest[0];
  };

  // `revoke-tokens <person>`: the person is where a verb would be.
  if (area === "revoke-tokens") {
    if (!verb || rest.length > 0) throw new UsageError(USAGE);
    const answer = await client(addresses.revokePersonTokens, { params: { id: verb } });
    if (answer.status !== 200) return refused(answer);
    io.log(`Every token of ${verb} is revoked.`);
    return 0;
  }

  switch (`${area} ${verb ?? ""}`.trim()) {
    case "tools list": {
      const answer = await client(addresses.listTools);
      if (answer.status !== 200) return refused(answer);
      table(
        io,
        ["TOOL", "PRODUCTION", "PREVIEWS"],
        answer.body.tools.map((t) => [t.name, t.production ?? "-", String(t.previews.length)]),
      );
      return 0;
    }
    case "approvals list": {
      const answer = await client(addresses.listApprovals);
      if (answer.status !== 200) return refused(answer);
      const rows = answer.body.versions.flatMap((v) =>
        v.approvals.map((a) => [a.id, v.tool, v.version, a.resource, a.kind]),
      );
      table(io, ["ID", "TOOL", "VERSION", "RESOURCE", "KIND"], rows);
      return 0;
    }
    case "approvals approve":
    case "approvals reject": {
      const id = one("an approval id (forgeron admin approvals list)");
      const answer = await client(addresses.decideApproval, {
        params: { id },
        json: { decision: verb === "approve" ? "approved" : "rejected" },
      });
      if (answer.status !== 200) return refused(answer);
      io.log(`${id}: ${answer.body.status}.`);
      return 0;
    }
    case "members list": {
      const answer = await client(addresses.listMembers);
      if (answer.status !== 200) return refused(answer);
      table(
        io,
        ["ID", "EMAIL", "ROLES"],
        answer.body.members.map((m) => [m.id, m.email, m.roles.join(",") || "-"]),
      );
      for (const i of answer.body.invitations) {
        io.log(
          `invited  ${i.email}  ${i.roles.join(",") || "-"}  until ${i.expiresAt.slice(0, 10)}`,
        );
      }
      return 0;
    }
    case "members invite": {
      const email = one("an email address");
      const answer = await client(addresses.inviteMember, {
        json: { email, ...(values.role ? { roles: list(values.role) } : {}) },
      });
      if (answer.status !== 201) return refused(answer);
      io.log(`Invited ${email}.`);
      return 0;
    }
    case "members roles": {
      const id = one("a member id");
      if (values.set === undefined)
        throw new UsageError("--set <name>,...: the roles the member has.");
      const answer = await client(addresses.setMemberRoles, {
        params: { id },
        json: { roles: list(values.set) },
      });
      if (answer.status !== 200) return refused(answer);
      io.log(`${id}: ${list(values.set).join(", ") || "no role"}.`);
      return 0;
    }
    case "members remove": {
      const id = one("a member id");
      const answer = await client(addresses.removeMember, { params: { id } });
      if (answer.status !== 204) return refused(answer);
      io.log(`Removed ${id}.`);
      return 0;
    }
    case "audit": {
      // `audit` has no verb: the first word after it, if any, is a mistake.
      if (verb !== undefined) throw new UsageError(USAGE);
      const answer = await client(addresses.audit, {
        query: { ...(values.limit ? { limit: values.limit } : {}) },
      });
      if (answer.status !== 200) return refused(answer);
      for (const line of answer.body.entries) {
        io.log(
          `${String(line.at).slice(0, 19)}  ${String(line.tool ?? "-").padEnd(12)} ${String(line.kind).padEnd(10)} ${String(line.subject)}  ${String(line.actor)}  ${String(line.result)}`,
        );
      }
      return 0;
    }
    case "user-secrets list": {
      const answer = await client(addresses.listUserSecretHolders, {
        params: { tool: toolOf(project, values.tool) },
      });
      if (answer.status !== 200) return refused(answer);
      table(
        io,
        ["PERSON", "SECRETS (names only)"],
        answer.body.holders.map((h) => [h.person, h.names.join(",")]),
      );
      return 0;
    }
    case "user-secrets revoke": {
      if (!values.person) throw new UsageError("--person <id>: whose secrets.");
      const tool = toolOf(project, values.tool);
      const answer = values.name
        ? await client(addresses.revokeUserSecret, {
            params: { tool, person: values.person, name: values.name },
          })
        : await client(addresses.revokeUserSecrets, { params: { tool, person: values.person } });
      if (answer.status !== 200) return refused(answer);
      io.log(`Revoked ${answer.body.revoked} secret${answer.body.revoked === 1 ? "" : "s"}.`);
      return 0;
    }
    case "user-secrets set": {
      if (!values.person || !values.name) {
        throw new UsageError("--person <id> and --name <SECRET>: whose secret, and which.");
      }
      if (!io.readSecret) throw new UsageError("No keyboard to read the value from.");
      const value = await io.readSecret(`Value of ${values.name} for ${values.person}: `);
      if (!value) throw new UsageError("An empty value was not sent.");
      const answer = await client(addresses.setUserSecret, {
        params: { tool: toolOf(project, values.tool), person: values.person, name: values.name },
        json: { value },
      });
      if (answer.status !== 204) return refused(answer);
      io.log(
        `Set ${values.name} for ${values.person}. It is recorded in the audit log and they can see it.`,
      );
      return 0;
    }
    case "reseal": {
      const answer = await client(addresses.resealSecrets);
      if (answer.status !== 200) return refused(answer);
      const r = answer.body;
      io.log(
        `${r.resealed} sealed again, ${r.current} already current, ${r.unreadable} unreadable.`,
      );
      if (r.unreadable > 0) io.log("An unreadable value is no key's: it must be typed again.");
      return r.unreadable > 0 ? 3 : 0;
    }
    default:
      throw new UsageError(USAGE);
  }
}

const API_USAGE = `Usage: forgeron api <METHOD> <path> [--data <json> | --data-file <path>] [--endpoint <url>]

Calls a route of the workspace's console API with the token of \`forgeron login\`, like \`gh api\`:
  forgeron api GET /api/tools
  forgeron api POST /api/approvals/apr_1 --data '{"decision":"approved"}'
The path starts with /api/. The answer is printed as it came; the exit code is 1 for a refusal.`;

/** `forgeron api <METHOD> <path>`: any route of the console API. */
export async function api(args: string[], io: Io): Promise<number> {
  const { values, positionals } = parseArgs({
    args,
    allowPositionals: true,
    options: {
      endpoint: { type: "string" },
      data: { type: "string" },
      "data-file": { type: "string" },
    },
  });
  const [method, path] = positionals;
  if (
    positionals.length !== 2 ||
    !method ||
    !path ||
    !/^(GET|POST|PUT|PATCH|DELETE)$/i.test(method) ||
    !path.startsWith("/api/") ||
    path.includes("..") ||
    (values.data !== undefined && values["data-file"] !== undefined)
  ) {
    throw new UsageError(API_USAGE);
  }
  const verb = method.toUpperCase();
  let body: string | undefined;
  if (values.data !== undefined) body = values.data;
  if (values["data-file"] !== undefined) {
    body = await readFile(resolve(io.cwd, values["data-file"]), "utf8");
  }
  if (body !== undefined) {
    try {
      JSON.parse(body);
    } catch {
      throw new UsageError("The data is not JSON.");
    }
  }
  const { endpoint } = await workspaceOf(io, values.endpoint);
  const token = await credentialsOf(io);
  const response = await fetch(`${endpoint}/console-api${path}`, {
    method: verb,
    headers: {
      accept: "application/json",
      authorization: `Bearer ${token}`,
      ...(body === undefined ? {} : { "content-type": "application/json" }),
    },
    ...(body === undefined ? {} : { body }),
  });
  const text = await response.text();
  if (text) {
    let shown = text;
    try {
      shown = JSON.stringify(JSON.parse(text), null, 2);
    } catch {
      // Not JSON (a page, a proxy's answer): printed as it came.
    }
    (response.ok ? io.log : io.error)(shown);
  }
  return response.ok ? 0 : 1;
}
