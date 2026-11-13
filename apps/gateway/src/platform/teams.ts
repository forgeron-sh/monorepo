import {
  createTeamRoute,
  deleteTeamRoute,
  listTeamsRoute,
  updateTeamRoute,
} from "@forgeron/platform-contract";
import { RegistryError, teamRole, type Team } from "@forgeron/registry";
import type { OpenAPIHono } from "@hono/zod-openapi";
import { platformRoute, type PlatformEnv } from "./app";

// The workspace's teams (D-132): named groups of members, read by anyone signed in and changed by an
// admin. A team is also a subject of the access matrix, named `team-<id>`.

const shown = (t: Team) => ({
  id: t.id,
  name: t.name,
  description: t.description,
  members: t.members,
  role: teamRole(t.id),
});
const refused = (error: RegistryError) => ({
  status: error.code === "NOT_FOUND" ? 404 : error.code === "INVALID" ? 400 : 409,
  body: { error: error.code, message: error.message },
});

export function mountTeams(app: OpenAPIHono<PlatformEnv>): void {
  app.openapi(platformRoute(listTeamsRoute, "member"), async (c) => {
    const { registry, workspace } = c.env;
    return c.json({ teams: (await registry.listTeams(workspace)).map(shown) }, 200);
  });

  app.openapi(platformRoute(createTeamRoute, "admin"), async (c) => {
    const body = c.req.valid("json");
    try {
      const team = await c.env.registry.createTeam(
        c.env.workspace,
        {
          id: body.id,
          name: body.name,
          ...(body.description !== undefined ? { description: body.description } : {}),
          ...(body.members ? { members: body.members } : {}),
        },
        c.get("person").id,
      );
      return c.json(shown(team), 201);
    } catch (error) {
      if (error instanceof RegistryError) {
        const { status, body: refusal } = refused(error);
        return c.json(refusal, status as 400 | 409);
      }
      throw error;
    }
  });

  app.openapi(platformRoute(updateTeamRoute, "admin"), async (c) => {
    const body = c.req.valid("json");
    try {
      const team = await c.env.registry.updateTeam(
        c.env.workspace,
        c.req.valid("param").id,
        {
          ...(body.name !== undefined ? { name: body.name } : {}),
          ...(body.description !== undefined ? { description: body.description } : {}),
          ...(body.members ? { members: body.members } : {}),
        },
        c.get("person").id,
      );
      return c.json(shown(team), 200);
    } catch (error) {
      if (error instanceof RegistryError) {
        const { status, body: refusal } = refused(error);
        return c.json(refusal, status as 404 | 400 | 409);
      }
      throw error;
    }
  });

  app.openapi(platformRoute(deleteTeamRoute, "admin"), async (c) => {
    try {
      await c.env.registry.deleteTeam(c.env.workspace, c.req.valid("param").id, c.get("person").id);
      return c.body(null, 204);
    } catch (error) {
      if (error instanceof RegistryError) {
        const { status, body } = refused(error);
        return c.json(body, status as 404);
      }
      throw error;
    }
  });
}
