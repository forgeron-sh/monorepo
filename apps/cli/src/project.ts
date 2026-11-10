import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { UsageError } from "./io";

// `.forgeron/project.json` (docs/sdk.md §4): which workspace and which tool a folder is linked to.
// It holds no secret and is committed.

export interface ProjectFile {
  tool: string;
  workspace?: string;
  endpoint?: string;
  toolId?: string;
}

// sdk.md §7: `[a-z0-9-]`, 3 to 40 characters; some names belong to the platform.
const RESERVED = new Set([
  "www",
  "app",
  "api",
  "docs",
  "status",
  "console",
  "mcp",
  "admin",
  "auth",
  "cdn",
  "static",
  "play",
]);

export function checkWorkspace(workspace: string): string {
  if (!/^[a-z0-9-]{3,40}$/.test(workspace)) {
    throw new UsageError(
      `"${workspace}" is not a workspace name: use 3 to 40 characters among a-z, 0-9 and "-".`,
    );
  }
  if (RESERVED.has(workspace)) {
    throw new UsageError(
      `"${workspace}" is reserved by the platform: choose another workspace name.`,
    );
  }
  return workspace;
}

const defaultEndpoint = (workspace: string) => `https://${workspace}.forgeron.app`;

/**
 * What `--workspace` names: a workspace (`acme`, on forgeron.app) or the full host of an install
 * (`forgeron.example.com`: the workspace is its first label, the address is the host itself).
 */
export function parseWorkspace(input: string): { workspace: string; endpoint: string } {
  if (!input.includes(".")) {
    const workspace = checkWorkspace(input);
    return { workspace, endpoint: defaultEndpoint(workspace) };
  }
  const host = input.trim().toLowerCase().replace(/\.$/, "");
  const labels = host.split(".");
  if (labels.length < 3 || !labels.every((l) => /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(l))) {
    throw new UsageError(
      `"${input}" is not a workspace host: use <workspace>.<domain>, for example acme.forgeron.app.`,
    );
  }
  return { workspace: checkWorkspace(labels[0]!), endpoint: `https://${host}` };
}

const file = (dir: string) => join(dir, ".forgeron", "project.json");

export async function readProject(dir: string): Promise<ProjectFile | undefined> {
  try {
    return JSON.parse(await readFile(file(dir), "utf8")) as ProjectFile;
  } catch {
    return undefined;
  }
}

export async function writeProject(dir: string, project: ProjectFile): Promise<void> {
  await mkdir(join(dir, ".forgeron"), { recursive: true });
  await writeFile(file(dir), `${JSON.stringify(project, null, 2)}\n`);
}

/**
 * The endpoint a command talks to: `--endpoint`, else the project file's (`forgeron link`), else
 * the address of `--workspace` (a name, or a full host). A `--workspace` that is the linked one keeps the linked endpoint,
 * which may be another than the default (`forgeron link --endpoint`).
 */
export async function resolveEndpoint(
  flags: { workspace?: string; endpoint?: string },
  dir: string,
): Promise<string> {
  if (flags.endpoint) return flags.endpoint;
  const project = await readProject(dir);
  if (flags.workspace) {
    const { workspace, endpoint } = parseWorkspace(flags.workspace);
    if (project?.endpoint && project.workspace === workspace && !flags.workspace.includes(".")) {
      return project.endpoint;
    }
    return endpoint;
  }
  if (project?.endpoint) return project.endpoint;
  throw new UsageError(
    "No workspace to talk to: run `forgeron link --workspace <name>` first, or pass --workspace.",
  );
}
