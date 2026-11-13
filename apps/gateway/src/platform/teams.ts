import {
  createTeamRoute,
  deleteTeamRoute,
  listPermissionsRoute,
  listTeamsRoute,
  updateTeamRoute,
} from "@forgeron/platform-contract";
import { PLATFORM, PLATFORM_GROUPS } from "@forgeron/permissions";
import { RegistryError, type Team } from "@forgeron/registry";
import type { OpenAPIHono } from "@hono/zod-openapi";
import { platformRoute, type PlatformEnv } from "./app";

// The workspace's teams (D-132, D-137): named groups of members and what each may do on Forgeron, read
// by anyone signed in and changed by who holds `teams:write`. A change of a team's members or
// permissions is also limited to what the caller holds (anti-escalation): the registry checks it with
// `actorPermissions` and says `FORBIDDEN`. A team is also a subject of the access matrix, `team:<id>`.

const shown = (t: Team) => ({
  id: t.id,
  name: t.name,
  description: t.description,
  members: t.members,
  builtIn: t.builtIn,
  locked: t.locked,
  permissions: t.permissions,
  effective: t.effective,
});
const refused = (error: RegistryError) => ({
  status:
    error.code === "NOT_FOUND"
      ? 404
      : error.code === "INVALID"
        ? 400
        : error.code === "FORBIDDEN"
          ? 403
          : 409,
  body: { error: error.code, message: error.message },
});

export function mountTeams(app: OpenAPIHono<PlatformEnv>): void {
  app.openapi(platformRoute(listTeamsRoute, "signed-in"), async (c) => {
    const { registry, workspace } = c.env;
    return c.json({ teams: (await registry.listTeams(workspace)).map(shown) }, 200);
  });

  app.openapi(platformRoute(listPermissionsRoute, "signed-in"), (c) =>
    c.json(
      {
        groups: PLATFORM_GROUPS.map((group) => ({
          label: group.label,
          permissions: group.permissions.map((name) => ({
            name,
            label: PLATFORM.permissions[name].label,
            description: PLATFORM.permissions[name].description,
            implies: [...(PLATFORM.permissions[name].implies ?? [])],
          })),
        })),
      },
      200,
    ),
  );

  app.openapi(platformRoute(createTeamRoute, "teams:write"), async (c) => {
    const body = c.req.valid("json");
    try {
      const team = await c.env.registry.createTeam(
        c.env.workspace,
        {
          id: body.id,
          name: body.name,
          ...(body.description !== undefined ? { description: body.description } : {}),
          ...(body.members ? { members: body.members } : {}),
          ...(body.permissions ? { permissions: body.permissions } : {}),
        },
        c.get("person").id,
        c.get("person").permissions,
        c.env.via,
      );
      return c.json(shown(team), 201);
    } catch (error) {
      if (error instanceof RegistryError) {
        const { status, body: refusal } = refused(error);
        return c.json(refusal, status as 400 | 403 | 409);
      }
      throw error;
    }
  });

  app.openapi(platformRoute(updateTeamRoute, "teams:write"), async (c) => {
    const body = c.req.valid("json");
    try {
      const team = await c.env.registry.updateTeam(
        c.env.workspace,
        c.req.valid("param").id,
        {
          ...(body.name !== undefined ? { name: body.name } : {}),
          ...(body.description !== undefined ? { description: body.description } : {}),
          ...(body.members ? { members: body.members } : {}),
          ...(body.permissions ? { permissions: body.permissions } : {}),
        },
        c.get("person").id,
        c.get("person").permissions,
        c.env.via,
      );
      return c.json(shown(team), 200);
    } catch (error) {
      if (error instanceof RegistryError) {
        const { status, body: refusal } = refused(error);
        return c.json(refusal, status as 404 | 400 | 403 | 409);
      }
      throw error;
    }
  });

  app.openapi(platformRoute(deleteTeamRoute, "teams:write"), async (c) => {
    try {
      await c.env.registry.deleteTeam(
        c.env.workspace,
        c.req.valid("param").id,
        c.get("person").id,
        c.env.via,
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
}
