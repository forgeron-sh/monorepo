import {
  getMembershipSettingsRoute,
  inviteMemberRoute,
  listMembersRoute,
  putMembershipSettingsRoute,
  removeMemberRoute,
  setMemberRolesRoute,
  withdrawInvitationRoute,
} from "@forgeron/platform-contract";
import { RegistryError, type Member, type Registry } from "@forgeron/registry";
import type { OpenAPIHono } from "@hono/zod-openapi";
import { methodNotAllowed, platformRoute, type PlatformEnv } from "./app";

// The people of the workspace and how they get in (D-049), for admins. Every change is audited by the
// registry, in the same batch as the write. A member is never told apart from another by anything but
// their roles; `admin` is never a default role.

const INVITATION_DAYS = 14;

const shown = (m: Member) => ({ id: m.id, email: m.email, name: m.name, roles: m.roles });
const trimmed = (list: string[]) => list.map((v) => v.trim());
const refused = (error: RegistryError) => ({
  status: error.code === "NOT_FOUND" ? 404 : error.code === "INVALID" ? 400 : 409,
  body: { error: error.code, message: error.message },
});
// The messages the old handler gave, which the console shows as they are.
const invalid = (message: string) => (result: { success: boolean }, c: import("hono").Context) =>
  result.success ? undefined : c.json({ error: "INVALID", message }, 400);

async function settings(
  registry: Pick<Registry, "getMembershipSettings">,
  workspace: string,
  installDomains: string[],
) {
  const saved = await registry.getMembershipSettings(workspace);
  return {
    domains: saved?.domains ?? installDomains,
    ...(saved?.defaultRole ? { defaultRole: saved.defaultRole } : {}),
    source: saved ? ("console" as const) : ("install" as const),
  };
}

export function mountMembers(app: OpenAPIHono<PlatformEnv>): void {
  app.openapi(platformRoute(listMembersRoute, "admin"), async (c) => {
    const { registry, workspace, installDomains } = c.env;
    return c.json(
      {
        members: (await registry.listMembers(workspace)).map(shown),
        invitations: (await registry.listInvitations(workspace)).map((i) => ({
          email: i.email,
          roles: i.roles,
          invitedBy: i.invitedBy,
          expiresAt: i.expiresAt,
        })),
        settings: await settings(registry, workspace, installDomains),
      },
      200,
    );
  });

  app.openapi(
    platformRoute(setMemberRolesRoute, "admin"),
    async (c) => {
      const { registry, workspace } = c.env;
      try {
        const member = await registry.setMemberRoles(
          workspace,
          c.req.valid("param").id,
          trimmed(c.req.valid("json").roles),
          c.get("person").id,
        );
        return c.json(shown(member), 200);
      } catch (error) {
        if (error instanceof RegistryError) {
          const { status, body } = refused(error);
          return c.json(body, status as 404 | 400 | 409);
        }
        throw error;
      }
    },
    invalid("`roles` is a list of role names."),
  );

  app.openapi(platformRoute(removeMemberRoute, "admin"), async (c) => {
    try {
      await c.env.registry.removeMember(
        c.env.workspace,
        c.req.valid("param").id,
        c.get("person").id,
      );
      return c.body(null, 204);
    } catch (error) {
      if (error instanceof RegistryError) {
        const { status, body } = refused(error);
        return c.json(body, status as 404 | 409);
      }
      throw error;
    }
  });

  app.openapi(
    platformRoute(inviteMemberRoute, "admin"),
    async (c) => {
      const { registry, workspace, now, notify } = c.env;
      const body = c.req.valid("json");
      try {
        const invitation = await registry.inviteMember(workspace, {
          email: body.email.trim().toLowerCase(),
          roles: trimmed(body.roles ?? []),
          invitedBy: c.get("person").id,
          expiresAt: new Date(now().getTime() + INVITATION_DAYS * 24 * 60 * 60 * 1000),
        });
        const notified = (await notify?.(invitation).catch(() => false)) ?? false;
        return c.json(
          {
            invitation: {
              email: body.email.trim().toLowerCase(),
              roles: trimmed(body.roles ?? []),
              expiresAt: invitation.expiresAt,
            },
            notified,
          },
          201,
        );
      } catch (error) {
        if (error instanceof RegistryError) {
          const { status, body: refusal } = refused(error);
          return c.json(refusal, status as 400 | 409);
        }
        throw error;
      }
    },
    invalid("`email` and `roles` (a list of role names) are required."),
  );

  app.openapi(platformRoute(withdrawInvitationRoute, "admin"), async (c) => {
    const withdrawn = await c.env.registry.revokeInvitation(
      c.env.workspace,
      c.req.valid("param").email,
      c.get("person").id,
    );
    return withdrawn
      ? c.body(null, 204)
      : c.json({ error: "NOT_FOUND", message: "No such invitation." }, 404);
  });

  app.openapi(platformRoute(getMembershipSettingsRoute, "admin"), async (c) =>
    c.json(await settings(c.env.registry, c.env.workspace, c.env.installDomains), 200),
  );

  app.openapi(
    platformRoute(putMembershipSettingsRoute, "admin"),
    async (c) => {
      const { registry, workspace, installDomains } = c.env;
      const body = c.req.valid("json");
      try {
        await registry.setMembershipSettings(
          workspace,
          {
            domains: trimmed(body.domains),
            ...(typeof body.defaultRole === "string" && body.defaultRole
              ? { defaultRole: body.defaultRole }
              : {}),
          },
          c.get("person").id,
        );
        return c.json(await settings(registry, workspace, installDomains), 200);
      } catch (error) {
        if (error instanceof RegistryError) {
          const { status, body: refusal } = refused(error);
          return c.json(refusal, status as 400 | 409);
        }
        throw error;
      }
    },
    invalid("`domains` is a list of domains; `defaultRole` a role name or null."),
  );

  app.all("/api/members", methodNotAllowed);
  app.all("/api/members/:id", methodNotAllowed);
  app.all("/api/invitations", methodNotAllowed);
  app.all("/api/invitations/:email", methodNotAllowed);
  app.all("/api/membership-settings", methodNotAllowed);
}
