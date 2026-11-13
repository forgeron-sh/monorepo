import {
  getPlatformUpdateRoute,
  getPlatformUpdateRunRoute,
  startPlatformUpdateRoute,
} from "@forgeron/platform-contract";
import type { OpenAPIHono } from "@hono/zod-openapi";
import { methodNotAllowed, platformRoute, type PlatformEnv } from "./app";

// The platform updating itself (D-138). Reading what is newer needs `settings:read`, the panel being
// in Install information; updating needs `platform:update`. `/api/workspace` is not touched: the
// console asks these routes for the rest.

export function mountPlatformUpdate(app: OpenAPIHono<PlatformEnv>): void {
  app.openapi(platformRoute(getPlatformUpdateRoute, "settings:read"), async (c) =>
    c.json(await c.env.update.state(), 200),
  );

  app.openapi(platformRoute(startPlatformUpdateRoute, "platform:update"), async (c) => {
    const person = c.get("person");
    const started = await c.env.update.start(c.req.valid("json").version, person.id);
    switch (started.status) {
      case "started":
        return c.json({ run: started.run }, 202);
      case "blocked":
        return c.json({ error: started.blocked.code, message: started.blocked.message }, 409);
      case "running":
        return c.json({ error: "RUNNING", message: "An update is already running." }, 409);
      case "not-newer":
        return c.json(
          {
            error: "NOT_NEWER",
            message: `This platform runs ${started.current}: it is only updated to a newer release.`,
          },
          409,
        );
    }
  });

  app.openapi(platformRoute(getPlatformUpdateRunRoute, "settings:read"), async (c) => {
    const run = await c.env.update.run(c.req.valid("param").id);
    return run
      ? c.json({ run }, 200)
      : c.json({ error: "NOT_FOUND", message: "There is no such update." }, 404);
  });

  app.all("/api/platform/update", methodNotAllowed);
  app.all("/api/platform/update/runs/:id", methodNotAllowed);
}
