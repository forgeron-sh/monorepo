import { isPermission, PLATFORM, type PlatformPermission } from "@forgeron/permissions";
import { addresses } from "@forgeron/platform-contract/client";
import { ok, typedClient, type FetchJson } from "./api";

// The workspace and the signed-in person: the answer of `GET /api/workspace`. Only what the shell and
// the first-run checklist draw is kept.

export interface WorkspaceInfo {
  workspace: string;
  endpoint: string;
  person: {
    id: string;
    email: string;
    name: string;
    /** The ids of the teams the person is in (D-136); everyone is also part of `everyone`, not listed. */
    teams: string[];
    /** What the person may do on the platform: every screen and control is decided with it (`can`). */
    permissions: PlatformPermission[];
    /** Their picture and where it comes from: the one they chose, or their provider's (D-133). */
    avatar?: { url: string; source: "custom" | "provider" };
  };
  setup: { members: number; invitations: number; tools: number; deployed: number; called: boolean };
  /** Admins only. */
  signIn?: {
    email: { enabled: boolean; mail: "email" | "console" | "off" };
    oidc: { enabled: boolean; configured: boolean };
    saml: { enabled: boolean; configured: boolean };
  };
  install?: { baseDomain?: string; version?: string; commit?: string };
}

const num = (value: unknown) => (typeof value === "number" ? value : 0);
const mailMode = (value: unknown) => (value === "email" || value === "console" ? value : "off");

export async function loadWorkspace(fetchJson: FetchJson): Promise<WorkspaceInfo> {
  const body = ok(await typedClient(fetchJson)(addresses.workspace));
  const info: WorkspaceInfo = {
    workspace: String(body.workspace),
    endpoint: String(body.endpoint),
    person: {
      id: String(body.person?.id),
      email: String(body.person?.email),
      name: String(body.person?.name),
      teams: Array.isArray(body.person?.teams) ? body.person.teams.map(String) : [],
      permissions: Array.isArray(body.person?.permissions)
        ? body.person.permissions
            .map(String)
            .filter((p): p is PlatformPermission => isPermission(PLATFORM, p))
        : [],
      ...(body.person?.avatar
        ? {
            avatar: {
              url: String(body.person.avatar.url),
              source:
                body.person.avatar.source === "custom"
                  ? ("custom" as const)
                  : ("provider" as const),
            },
          }
        : {}),
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
  if (body.install) {
    info.install = {
      ...(typeof body.install.baseDomain === "string"
        ? { baseDomain: body.install.baseDomain }
        : {}),
      ...(typeof body.install.version === "string" ? { version: body.install.version } : {}),
      ...(typeof body.install.commit === "string" ? { commit: body.install.commit } : {}),
    };
  }
  return info;
}
