import type { FetchJson } from "./api";

// The workspace and the signed-in person: the answer of `GET /api/workspace`. Only what the shell and
// the first-run checklist draw is kept.

export interface WorkspaceInfo {
  workspace: string;
  endpoint: string;
  person: { id: string; email: string; name: string; roles: string[]; admin: boolean };
  setup: { members: number; invitations: number; tools: number; deployed: number; called: boolean };
  /** Admins only. */
  signIn?: {
    email: { enabled: boolean; mail: "email" | "console" | "off" };
    oidc: { enabled: boolean; configured: boolean };
    saml: { enabled: boolean; configured: boolean };
  };
  install?: { baseDomain: string };
}

const num = (value: unknown) => (typeof value === "number" ? value : 0);
const mailMode = (value: unknown) => (value === "email" || value === "console" ? value : "off");

export async function loadWorkspace(fetchJson: FetchJson): Promise<WorkspaceInfo> {
  const body = (await fetchJson("/api/workspace")) as Record<string, any>;
  const info: WorkspaceInfo = {
    workspace: String(body.workspace),
    endpoint: String(body.endpoint),
    person: {
      id: String(body.person?.id),
      email: String(body.person?.email),
      name: String(body.person?.name),
      roles: Array.isArray(body.person?.roles) ? body.person.roles.map(String) : [],
      admin: body.person?.admin === true,
    },
    setup: {
      members: num(body.setup?.members),
      invitations: num(body.setup?.invitations),
      tools: num(body.setup?.tools),
      deployed: num(body.setup?.deployed),
      called: body.setup?.called === true,
    },
  };
  if (body.signIn) {
    info.signIn = {
      email: {
        enabled: body.signIn.email?.enabled === true,
        mail: mailMode(body.signIn.email?.mail),
      },
      oidc: {
        enabled: body.signIn.oidc?.enabled === true,
        configured: body.signIn.oidc?.configured === true,
      },
      saml: {
        enabled: body.signIn.saml?.enabled === true,
        configured: body.signIn.saml?.configured === true,
      },
    };
  }
  if (body.install) info.install = { baseDomain: String(body.install.baseDomain) };
  return info;
}
