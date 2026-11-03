import { RegistryError, type Invitation, type Member, type Registry } from "@forgeron/registry";

// The people of the workspace and how they get in (D-049), for admins:
//   GET    /api/members                    { members, invitations, settings }
//   PATCH  /api/members/<id>               { roles }                 change a member's roles
//   DELETE /api/members/<id>               remove a member
//   POST   /api/invitations                { email, roles }          invite an email (and tell it by mail)
//   DELETE /api/invitations/<email>        withdraw an invitation
//   PUT    /api/membership-settings        { domains, defaultRole }  who joins by email domain
// Every change is audited by the registry. A member is never told apart from another by anything
// but their roles; `admin` is never a default role.

const ROUTE =
  /^\/api\/(?:(members)(?:\/([A-Za-z0-9_-]+))?|(invitations)(?:\/([^/]+))?|(membership-settings))$/;
const INVITATION_DAYS = 14;
const MAX_ROLES = 20;

export interface MembersApiOptions {
  registry: Registry;
  workspace: string;
  /** Domains from the install (`--member-email-domains`): used until an admin saves their own. */
  installDomains: string[];
  caller(request: Request): Promise<{ admin: boolean; id: string } | undefined>;
  now(): Date;
  /** Tells an invited address where to sign in. Best effort: `false` when it could not be sent. */
  notify?(invitation: Invitation): Promise<boolean>;
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

const shown = (m: Member) => ({ id: m.id, email: m.email, name: m.name, roles: m.roles });

const stringList = (value: unknown, max: number): string[] | undefined =>
  Array.isArray(value) && value.length <= max && value.every((v) => typeof v === "string")
    ? (value as string[]).map((v) => v.trim())
    : undefined;

export async function handleMembers(
  request: Request,
  options: MembersApiOptions,
): Promise<Response | undefined> {
  const match = ROUTE.exec(new URL(request.url).pathname);
  if (!match) return undefined;
  const [, members, memberId, invitations, invitationEmail, settingsRoute] = match;
  const { registry, workspace } = options;

  const caller = await options.caller(request);
  if (!caller) return json(401, { error: "UNAUTHENTICATED" });
  if (!caller.admin) return json(403, { error: "FORBIDDEN", message: "This is for admins." });

  const settings = async () => {
    const saved = await registry.getMembershipSettings(workspace);
    return {
      domains: saved?.domains ?? options.installDomains,
      ...(saved?.defaultRole ? { defaultRole: saved.defaultRole } : {}),
      source: saved ? "console" : "install",
    };
  };
  const overview = async () => ({
    members: (await registry.listMembers(workspace)).map(shown),
    invitations: (await registry.listInvitations(workspace)).map((i) => ({
      email: i.email,
      roles: i.roles,
      invitedBy: i.invitedBy,
      expiresAt: i.expiresAt,
    })),
    settings: await settings(),
  });

  if (request.method === "GET" && members && !memberId) return json(200, await overview());
  if (request.method === "GET" && settingsRoute) return json(200, await settings());

  // A write is JSON: a form post from another site cannot send that without our consent.
  if (request.method !== "GET" && request.method !== "DELETE") {
    if (!(request.headers.get("content-type") ?? "").startsWith("application/json")) {
      return json(415, { error: "INVALID", message: "Send JSON." });
    }
  }
  const body = async (): Promise<Record<string, unknown> | undefined> => {
    try {
      const parsed: unknown = await request.json();
      return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : undefined;
    } catch {
      return undefined;
    }
  };
  const invalid = (message: string) => json(400, { error: "INVALID", message });

  try {
    if (members && memberId && request.method === "PATCH") {
      const roles = stringList((await body())?.roles, MAX_ROLES);
      if (!roles) return invalid("`roles` is a list of role names.");
      return json(200, shown(await registry.setMemberRoles(workspace, memberId, roles, caller.id)));
    }
    if (members && memberId && request.method === "DELETE") {
      await registry.removeMember(workspace, memberId, caller.id);
      return new Response(null, { status: 204 });
    }
    if (invitations && !invitationEmail && request.method === "POST") {
      const b = await body();
      const email = typeof b?.email === "string" ? b.email.trim().toLowerCase() : "";
      const roles = stringList(b?.roles ?? [], MAX_ROLES);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || !roles) {
        return invalid("`email` and `roles` (a list of role names) are required.");
      }
      const invitation = await registry.inviteMember(workspace, {
        email,
        roles,
        invitedBy: caller.id,
        expiresAt: new Date(options.now().getTime() + INVITATION_DAYS * 24 * 60 * 60 * 1000),
      });
      const notified = (await options.notify?.(invitation).catch(() => false)) ?? false;
      return json(201, {
        invitation: { email, roles, expiresAt: invitation.expiresAt },
        notified,
      });
    }
    if (invitations && invitationEmail && request.method === "DELETE") {
      const email = decodeURIComponent(invitationEmail);
      return (await registry.revokeInvitation(workspace, email, caller.id))
        ? new Response(null, { status: 204 })
        : json(404, { error: "NOT_FOUND", message: "No such invitation." });
    }
    if (settingsRoute && request.method === "PUT") {
      const b = await body();
      const domains = stringList(b?.domains, 50);
      const role = b?.defaultRole;
      if (!domains || (role !== undefined && role !== null && typeof role !== "string")) {
        return invalid("`domains` is a list of domains; `defaultRole` a role name or null.");
      }
      await registry.setMembershipSettings(
        workspace,
        { domains, ...(typeof role === "string" && role ? { defaultRole: role } : {}) },
        caller.id,
      );
      return json(200, await settings());
    }
  } catch (error) {
    if (error instanceof RegistryError) {
      const status = error.code === "NOT_FOUND" ? 404 : error.code === "INVALID" ? 400 : 409;
      return json(status, { error: error.code, message: error.message });
    }
    throw error;
  }
  return json(405, { error: "METHOD_NOT_ALLOWED" });
}
