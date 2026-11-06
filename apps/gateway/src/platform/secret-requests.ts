import {
  createSecretRequestRoute,
  fulfilSecretRequestRoute,
  lookupSecretRequestRoute,
} from "@forgeron/platform-contract";
import { RegistryError } from "@forgeron/registry";
import type { OpenAPIHono } from "@hono/zod-openapi";
import type { Context } from "hono";
import { methodNotAllowed, platformRoute, type PlatformEnv } from "./app";

// Entering a secret from a link (docs/sdk.md §17, D-083). The link is asked for by a developer (or by
// the admin MCP for them) and used by the same person, signed in, on the console page. A value is
// read from the body of `fulfil`, handed to the registry and dropped: it is in no answer and no line.

const SECRET_NAME = /^[A-Z][A-Z0-9_]*$/;
const missing = (message: string) => ({ error: "NOT_FOUND", message });
const NO_LINK = missing("There is no such link for you, or it was already used.");
const EXPIRED = { error: "EXPIRED", message: "This link expired. Ask for a new one." };
const isEnvironment = (name: string): name is "preview" | "production" =>
  name === "preview" || name === "production";

/**
 * The link is used on the console page, by a person signed in there: a CLI token of the same person
 * is not enough, so that a program holding it (an agent, a script) cannot type a value in the
 * person's place. Where the gateway has no session to ask (identity off), the guard has refused already.
 */
async function signedInOnThePage(c: Context<PlatformEnv>): Promise<boolean> {
  const bearer = c.env.bearer;
  return !bearer || (await bearer.session())?.id === c.get("person").id;
}
const NOT_SIGNED_IN = { error: "UNAUTHENTICATED" } as const;

export function mountSecretRequests(app: OpenAPIHono<PlatformEnv>): void {
  app.openapi(
    platformRoute(
      createSecretRequestRoute,
      "developer",
      "Asking for a link to enter a secret is for developers and admins.",
    ),
    async (c) => {
      const { registry, workspace, origin, via } = c.env;
      const { tool: toolName, environment, name } = c.req.valid("param");
      const tool = await registry.findTool(workspace, toolName);
      if (!tool) return c.json(missing(`There is no tool ${toolName}.`), 404);
      if (!isEnvironment(environment)) return c.json(missing("There is no such environment."), 404);
      if (!SECRET_NAME.test(name)) return c.json(missing("There is no such secret name."), 404);
      try {
        const { token, expiresAt } = await registry.requestSecret({
          toolId: tool.id,
          environment,
          name,
          person: c.get("person").id,
          ...(via ? { via } : {}),
        });
        // The token is in the fragment: a browser does not send it to any server, so no access log
        // of the gateway, a proxy or a CDN ever holds it.
        return c.json({ url: `${origin}/secret-request#${token}`, expiresAt }, 201);
      } catch (error) {
        if (error instanceof RegistryError) return c.json({ error: error.code }, 500);
        throw error;
      }
    },
  );

  app.openapi(
    platformRoute(lookupSecretRequestRoute, "member"),
    async (c) => {
      if (!(await signedInOnThePage(c))) return c.json(NOT_SIGNED_IN, 401);
      const { registry, workspace } = c.env;
      const found = await registry.secretRequest(
        workspace,
        c.req.valid("json").token,
        c.get("person").id,
      );
      if (found === "expired") return c.json(EXPIRED, 410);
      if (typeof found === "string") return c.json(NO_LINK, 404);
      const { tool, environment, name, expiresAt } = found;
      return c.json({ tool, environment, name, expiresAt }, 200);
    },
    (result, c) =>
      result.success ? undefined : c.json({ error: "INVALID", message: "Send `{ token }`." }, 400),
  );

  app.openapi(
    platformRoute(fulfilSecretRequestRoute, "member"),
    async (c) => {
      if (!(await signedInOnThePage(c))) return c.json(NOT_SIGNED_IN, 401);
      const { registry, workspace, via } = c.env;
      const { token, value } = c.req.valid("json");
      try {
        const done = await registry.fulfilSecretRequest(
          workspace,
          token,
          c.get("person").id,
          value,
          via,
        );
        if (done === "expired") return c.json(EXPIRED, 410);
        if (typeof done === "string") return c.json(NO_LINK, 404);
      } catch (error) {
        if (error instanceof RegistryError) return c.json({ error: error.code }, 500);
        throw error;
      }
      return c.body(null, 204);
    },
    (result, c) =>
      result.success
        ? undefined
        : c.json(
            { error: "INVALID", message: "Send `{ token, value }`; `value` is 16 KB at most." },
            400,
          ),
  );

  app.on(
    ["GET", "PUT", "PATCH", "DELETE", "OPTIONS"],
    "/api/secret-requests/lookup",
    methodNotAllowed,
  );
  app.on(
    ["GET", "PUT", "PATCH", "DELETE", "OPTIONS"],
    "/api/secret-requests/fulfil",
    methodNotAllowed,
  );
  app.on(
    ["GET", "PUT", "PATCH", "DELETE", "OPTIONS"],
    "/api/tools/:tool/environments/:environment/secrets/:name/request",
    methodNotAllowed,
  );
}
