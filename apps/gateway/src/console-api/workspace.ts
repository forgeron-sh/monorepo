import type { Registry } from "@forgeron/registry";

// `GET /api/workspace`: what the console shell and its first-run checklist draw (FOR-129).
//   { workspace, endpoint, person: { id, email, name, roles, admin },
//     setup: { members, invitations, tools, deployed, called },
//     signIn?, install? }                       (the last two are for admins)
// `setup` is counts only: members, pending invitations, tools, tools with a version on an environment,
// and whether any tool has been called. `signIn` says which methods are on and how mail is sent.

export interface SignInState {
  email: { enabled: boolean; mail: "email" | "console" | "off" };
  oidc: { enabled: boolean; configured: boolean };
  saml: { enabled: boolean; configured: boolean };
}

export interface WorkspaceApiOptions {
  registry: Registry;
  workspace: string;
  /** `https://<workspace>.<base domain>`: where people and tools reach the workspace. */
  endpoint: string;
  baseDomain: string;
  signIn(): Promise<SignInState>;
  caller(
    request: Request,
  ): Promise<{ id: string; email: string; name: string; roles: string[] } | undefined>;
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

export async function handleWorkspace(
  request: Request,
  options: WorkspaceApiOptions,
): Promise<Response | undefined> {
  if (new URL(request.url).pathname !== "/api/workspace") return undefined;
  if (request.method !== "GET") return json(405, { error: "METHOD_NOT_ALLOWED" });
  const person = await options.caller(request);
  if (!person) return json(401, { error: "UNAUTHENTICATED" });
  const { registry, workspace } = options;
  const admin = person.roles.includes("admin");

  const tools = await registry.listTools(workspace);
  let deployed = 0;
  let called = false;
  for (const tool of tools) {
    if ((await registry.listEnvironments(tool.id)).some((e) => e.versionId)) deployed += 1;
    if (!called)
      called = (await registry.listAudit(tool.id, { kind: "action", limit: 1 })).length > 0;
  }
  return json(200, {
    workspace,
    endpoint: options.endpoint,
    person: { ...person, admin },
    setup: {
      members: (await registry.listMembers(workspace)).length,
      invitations: (await registry.listInvitations(workspace)).length,
      tools: tools.length,
      deployed,
      called,
    },
    ...(admin
      ? {
          signIn: await options.signIn(),
          install: { baseDomain: options.baseDomain },
        }
      : {}),
  });
}
