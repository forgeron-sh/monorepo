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

export const defaultEndpoint = (workspace: string) => `https://${workspace}.forgeron.app`;

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
 * the default of `--workspace`. A `--workspace` that is the linked one keeps the linked endpoint,
 * which may be another than the default (`forgeron link --endpoint`).
 */
export async function resolveEndpoint(
  flags: { workspace?: string; endpoint?: string },
  dir: string,
): Promise<string> {
  if (flags.endpoint) return flags.endpoint;
  const project = await readProject(dir);
  if (flags.workspace) {
    const workspace = checkWorkspace(flags.workspace);
    if (project?.endpoint && project.workspace === workspace) return project.endpoint;
    return defaultEndpoint(workspace);
  }
  if (project?.endpoint) return project.endpoint;
  throw new UsageError(
    "No workspace to talk to: run `forgeron link --workspace <name>` first, or pass --workspace.",
  );
}
