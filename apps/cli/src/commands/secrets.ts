import { parseArgs } from "node:util";
import { UsageError, type Io } from "../io";
import { readCredentials } from "../credentials";
import { readProject } from "../project";
import { promptUserSecrets } from "./user-secrets";

// `forgeron secrets set <NAME> [--env <env>]` and `forgeron secrets list [--env <env>]` (sdk.md §5).
// The value is read from the keyboard (or piped input), never from an argument, so it does not land
// in the shell history or the process list. `list` shows names only. The platform encrypts at rest.
// Credentials: the token comes from `FORGERON_TOKEN`, the address from `.forgeron/project.json`.

const ENVIRONMENTS = ["preview", "pilot", "production"];
const USAGE =
  "Usage: forgeron secrets set <NAME> [--env <env>] | forgeron secrets list [--env <env>]";

export async function secrets(args: string[], io: Io): Promise<number> {
  const { positionals, values } = parseArgs({
    args,
    allowPositionals: true,
    options: {
      env: { type: "string", default: "production" },
      user: { type: "boolean", default: false },
    },
  });
  const [sub, name, ...rest] = positionals;
  const environment = values.env as string;
  if (!ENVIRONMENTS.includes(environment)) {
    throw new UsageError(`"${environment}" is not an environment: ${ENVIRONMENTS.join(", ")}.`);
  }
  if (
    rest.length > 0 ||
    (sub !== "set" && sub !== "list") ||
    (sub === "set") !== (name !== undefined)
  ) {
    throw new UsageError(USAGE);
  }
  if (name !== undefined && !/^[A-Z][A-Z0-9_]*$/.test(name)) {
    throw new UsageError(
      `"${name}" is not a secret name: use A-Z, 0-9 and "_", starting with a letter.`,
    );
  }

  if (values.user && (sub !== "set" || name === undefined)) {
    throw new UsageError("--user goes with `secrets set <NAME>`.");
  }
  const project = await readProject(io.cwd);
  if (!project?.endpoint) {
    throw new UsageError(
      "This tool is not linked to a workspace: run `forgeron link --workspace <name>`.",
    );
  }
  if (values.user) {
    // Your own secret, for this tool: the token of `forgeron login`, the tool's declared label and reason.
    const own = process.env.FORGERON_TOKEN ?? (await readCredentials(process.env, io.keychain));
    if (!own) throw new UsageError("Run `forgeron login` first.");
    const saved = await promptUserSecrets(
      io,
      { endpoint: project.endpoint, tool: project.tool, token: own },
      [
        {
          name: name!,
          label: name!,
          why: "Kept for you alone; the tool's developer cannot read it.",
        },
      ],
    );
    if (!saved) throw new UsageError("The value is empty: nothing was set.");
    return 0;
  }
  const token = process.env.FORGERON_TOKEN;
  if (!token) throw new UsageError("Set FORGERON_TOKEN to an admin token of the workspace.");
  const base = `${project.endpoint.replace(/\/+$/, "")}/api/tools/${project.tool}/environments/${environment}/secrets`;
  const headers = { authorization: `Bearer ${token}` };

  if (sub === "list") {
    const body = (await call(fetch(base, { headers }))) as { secrets: string[] };
    if (body.secrets.length === 0) io.log(`No secret is set in ${environment}.`);
    for (const secret of body.secrets) io.log(secret);
    return 0;
  }

  if (!io.readSecret) throw new UsageError("No keyboard to read the value from.");
  const value = await io.readSecret(`Value of ${name} (${environment}): `);
  if (value === "") throw new UsageError("The value is empty: nothing was set.");
  await call(
    fetch(`${base}/${name}`, {
      method: "PUT",
      headers: { ...headers, "content-type": "application/json" },
      body: JSON.stringify({ value }),
    }),
  );
  io.log(`Set ${name} in ${environment}.`);
  return 0;
}

async function call(pending: Promise<Response>): Promise<unknown> {
  let response: Response;
  try {
    response = await pending;
  } catch (error) {
    throw new Error(
      `Cannot reach the workspace: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  if (response.status === 401)
    throw new Error("The token was refused: it is missing, expired or not an admin's.");
  if (response.status === 403) throw new Error("Only an admin can manage secrets.");
  if (response.status === 404)
    throw new Error("The workspace does not know this tool: deploy it first.");
  if (!response.ok) throw new Error(`The workspace answered ${response.status}.`);
  return response.status === 204 ? undefined : response.json();
}
