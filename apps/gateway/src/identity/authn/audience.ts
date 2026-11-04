// The audience of a token: `<workspace>/<tool>` (`acme/crm`; sdk.md §7, Isolation point 5).
// The workspace grammar is `[a-z0-9-]`, 3 to 40 characters (sdk.md §7, "Addresses").

const WORKSPACE = /^[a-z0-9-]{3,40}$/;
// A tool's `name` is a single path segment; `@` and `/` would reach another tool or a branch.
const TOOL = /^[a-z0-9][a-z0-9-]*$/;

export function audienceOf(workspace: string, tool: string): string {
  if (!WORKSPACE.test(workspace)) throw new Error(`"${workspace}" is not a workspace name.`);
  if (!TOOL.test(tool)) throw new Error(`"${tool}" is not a tool name.`);
  return `${workspace}/${tool}`;
}

export function parseAudience(audience: string): { workspace: string; tool: string } | undefined {
  const [workspace, tool, ...rest] = audience.split("/");
  if (rest.length > 0 || workspace === undefined || tool === undefined) return undefined;
  return WORKSPACE.test(workspace) && TOOL.test(tool) ? { workspace, tool } : undefined;
}
