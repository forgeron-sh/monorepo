import { readCredentials } from "./credentials";
import { UsageError, type Io } from "./io";
import { platformClient } from "./platform-client";
import { readProject, type ProjectFile } from "./project";

// What a command that talks to a workspace needs (D-113): who the CLI is, which workspace, and which
// tool. The same rules for promote, the remote database and the admin commands.

/**
 * Who the CLI is to the gateway: `FORGERON_TOKEN` (a deployment token, CI) if set, else the token
 * `forgeron login` stored. The gateway decides what that token may do.
 */
export async function credentialsOf(io: Io): Promise<string> {
  const token = process.env.FORGERON_TOKEN || (await readCredentials(process.env, io.keychain));
  if (!token) {
    throw new UsageError(
      "Not signed in: run `forgeron login` (an administrator), or set FORGERON_TOKEN.",
    );
  }
  return token;
}

/**
 * The workspace: `--endpoint`, else `FORGERON_ENDPOINT`, else the one the tool's folder is linked to.
 * An admin command works outside a tool's folder, so the first two are there.
 */
export async function workspaceOf(
  io: Io,
  flag?: string,
): Promise<{ endpoint: string; project?: ProjectFile }> {
  const project = await readProject(io.cwd);
  const endpoint = flag || process.env.FORGERON_ENDPOINT || project?.endpoint;
  if (!endpoint) {
    throw new UsageError(
      "Which workspace? Pass --endpoint https://<workspace>.<domain>, set FORGERON_ENDPOINT, or run `forgeron link --workspace <name>` in the tool's folder.",
    );
  }
  if (!/^https?:\/\//.test(endpoint)) {
    throw new UsageError(`--endpoint ${endpoint}: an address starting with https://.`);
  }
  return { endpoint: endpoint.replace(/\/+$/, ""), ...(project ? { project } : {}) };
}

/** The tool: `--tool`, else the one of the folder. */
export function toolOf(project: ProjectFile | undefined, flag?: string): string {
  const tool = flag || project?.tool;
  if (!tool)
    throw new UsageError("Which tool? Pass --tool <name>, or run it in the tool's folder.");
  return tool;
}

/** The console API of the workspace (`/console-api/api/...`), with the caller's token. */
export const consoleClient = (endpoint: string, token: string) =>
  platformClient(`${endpoint.replace(/\/+$/, "")}/console-api`, token);

/** The sentence for a refusal of the console API, which answers `{ error, message }`. */
export function consoleRefusal(answer: { status: number; body: unknown }): string {
  const body = answer.body as { error?: unknown; message?: unknown } | undefined;
  if (answer.status === 401) return "Not signed in: run `forgeron login`.";
  if (answer.status === 403 && typeof body?.message !== "string") {
    return "This is for administrators of the workspace.";
  }
  return typeof body?.message === "string"
    ? body.message
    : `The workspace answered ${answer.status}.`;
}
