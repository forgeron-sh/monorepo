import { UsageError } from "./io";
import { readProject } from "./project";

// What `forgeron deploy` and `forgeron preview close` send (docs/sdk.md §15, D-123): `FORGERON_TOKEN`
// when it is set, otherwise, on GitHub Actions with `id-token: write`, an identity token GitHub gives
// for the workspace's address. Forgeron then knows the repository, and deploys the tool linked to it.

/** The workspace the tool deploys to: `.forgeron/project.json`, else `FORGERON_ENDPOINT`. */
export async function deployEndpoint(cwd: string): Promise<{ endpoint: string; tool?: string }> {
  const project = await readProject(cwd);
  const endpoint = project?.endpoint ?? (process.env.FORGERON_ENDPOINT || undefined);
  if (!endpoint) {
    throw new UsageError(
      "This tool is not linked to a workspace: run `forgeron link --workspace <name>` first, or set FORGERON_ENDPOINT.",
    );
  }
  return { endpoint, ...(project?.tool ? { tool: project.tool } : {}) };
}

/** The Bearer for a deployment: a deployment token, or GitHub Actions' identity for `endpoint`. */
export async function ciCredential(endpoint: string): Promise<string> {
  const token = process.env.FORGERON_TOKEN;
  if (token) return token;
  const url = process.env.ACTIONS_ID_TOKEN_REQUEST_URL;
  const bearer = process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN;
  if (!url || !bearer) {
    throw new UsageError(
      "FORGERON_TOKEN is not set: create a deployment token with `forgeron token create`, or run on GitHub Actions with `permissions: id-token: write`.",
    );
  }
  const request = new URL(url);
  // The audience is the workspace's address: a token for one workspace is refused by another.
  request.searchParams.set("audience", new URL(endpoint).origin);
  const response = await fetch(request, { headers: { authorization: `bearer ${bearer}` } });
  const value = response.ok
    ? ((await response.json().catch(() => ({}))) as { value?: unknown }).value
    : undefined;
  if (typeof value !== "string" || value === "") {
    throw new UsageError(
      `GitHub Actions gave no identity token (${response.status}): does the workflow have \`id-token: write\`?`,
    );
  }
  return value;
}
