import { parseArgs } from "node:util";
import { UsageError, type Io } from "../io";
import { parseWorkspace, readProject, writeProject } from "../project";

// `forgeron link --workspace <name | host> [--endpoint <url>]`: records which workspace this tool belongs to.
// Nothing is sent: the link is a file, and `toolId` is added when the tool is first deployed.

export async function link(args: string[], io: Io): Promise<number> {
  const { values, positionals } = parseArgs({
    args,
    allowPositionals: true,
    options: { workspace: { type: "string" }, endpoint: { type: "string" } },
  });
  if (positionals.length > 0 || !values.workspace) {
    throw new UsageError("Usage: forgeron link --workspace <name | host> [--endpoint <url>]");
  }
  const project = await readProject(io.cwd);
  if (!project) {
    throw new UsageError(
      "This folder has no .forgeron/project.json: run `forgeron init` first, or `forgeron link` from a tool folder.",
    );
  }

  const named = parseWorkspace(values.workspace);
  const workspace = named.workspace;
  const endpoint = values.endpoint ?? named.endpoint;
  // A tool linked to another workspace is no longer the same tool there.
  const { toolId: _, ...rest } = project;
  const same = project.workspace === workspace;
  await writeProject(io.cwd, { ...(same ? project : rest), workspace, endpoint });

  io.log(`Linked ${project.tool} to ${workspace} (${endpoint}).`);
  return 0;
}
