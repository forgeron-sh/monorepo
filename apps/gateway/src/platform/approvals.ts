import {
  decideApprovalRoute,
  listApprovalsRoute,
  listUserSecretHoldersRoute,
  revokePersonTokensRoute,
  revokeUserSecretRoute,
  revokeUserSecretsRoute,
} from "@forgeron/platform-contract";
import { RegistryError } from "@forgeron/registry";
import type { OpenAPIHono } from "@hono/zod-openapi";
import { LONGEST_TOKEN_SECONDS } from "../identity/authn/issue";
import { methodNotAllowed, platformRoute, type PlatformEnv } from "./app";

// The versions that wait for an admin (docs/sdk.md §3) and the admin's revocations (D-035, D-036), for
// admins. The registry audits a decision and refuses a second one. A value never comes out.

const REVOCATION_FORBIDDEN = "Revocation is for admins.";
const SECRET_NAME = /^[A-Z][A-Z0-9_]*$/;
const noTool = (name: string) => ({ error: "NOT_FOUND", message: `There is no tool ${name}.` });

export function mountApprovals(app: OpenAPIHono<PlatformEnv>): void {
  app.openapi(platformRoute(listApprovalsRoute, "admin"), async (c) => {
    const { registry, workspace } = c.env;
    const versions = [];
    for (const tool of await registry.listTools(workspace)) {
      for (const { version, approvals } of await registry.pendingVersions(tool.id)) {
        versions.push({
          tool: tool.name,
          id: version.id,
          version: version.version,
          approvals: approvals.map((a) => ({ id: a.id, resource: a.resource, kind: a.kind })),
        });
      }
    }
    return c.json({ versions }, 200);
  });

  app.openapi(
    platformRoute(decideApprovalRoute, "admin"),
    async (c) => {
      const { registry, workspace } = c.env;
      const id = c.req.valid("param").id;
      // Only a request of this workspace may be decided here.
      for (const tool of await registry.listTools(workspace)) {
        if (!(await registry.listApprovals(tool.id)).some((a) => a.id === id)) continue;
        try {
          const decided = await registry.decideApproval(
            id,
            c.req.valid("json").decision,
            c.get("person").id,
          );
          return c.json({ id: decided.id, status: decided.status }, 200);
        } catch (error) {
          if (error instanceof RegistryError) {
            return c.json(
              { error: error.code, message: error.message },
              error.code === "NOT_FOUND" ? 404 : 409,
            );
          }
          throw error;
        }
      }
      return c.json({ error: "NOT_FOUND", message: "No such approval." }, 404);
    },
    (result, c) =>
      result.success
        ? undefined
        : c.json({ error: "INVALID", message: "`decision` is `approved` or `rejected`." }, 400),
  );

  app.openapi(platformRoute(revokePersonTokensRoute, "admin", REVOCATION_FORBIDDEN), async (c) => {
    const { registry, workspace } = c.env;
    const person = c.req.valid("param").id;
    if (!(await registry.findMember(workspace, person))) {
      return c.json({ error: "NOT_FOUND", message: "There is no such person." }, 404);
    }
    await registry.revokePersonTokens(workspace, person, LONGEST_TOKEN_SECONDS);
    return c.json({ revoked: "all" as const, person }, 200);
  });

  app.openapi(
    platformRoute(listUserSecretHoldersRoute, "admin", REVOCATION_FORBIDDEN),
    async (c) => {
      const { registry, workspace } = c.env;
      const name = c.req.valid("param").tool;
      const tool = await registry.findTool(workspace, name);
      if (!tool) return c.json(noTool(name), 404);
      return c.json({ holders: await registry.userSecretHolders(tool.id) }, 200);
    },
  );

  app.openapi(platformRoute(revokeUserSecretsRoute, "admin", REVOCATION_FORBIDDEN), async (c) => {
    const { registry, workspace } = c.env;
    const { tool: name, person } = c.req.valid("param");
    const tool = await registry.findTool(workspace, name);
    if (!tool) return c.json(noTool(name), 404);
    return c.json({ revoked: await registry.revokeUserSecrets(tool.id, person) }, 200);
  });

  app.openapi(platformRoute(revokeUserSecretRoute, "admin", REVOCATION_FORBIDDEN), async (c) => {
    const { registry, workspace } = c.env;
    const { tool: name, person, name: secret } = c.req.valid("param");
    const tool = await registry.findTool(workspace, name);
    if (!tool) return c.json(noTool(name), 404);
    if (!SECRET_NAME.test(secret)) {
      return c.json({ error: "NOT_FOUND", message: "There is no such secret name." }, 404);
    }
    return c.json({ revoked: await registry.revokeUserSecrets(tool.id, person, secret) }, 200);
  });

  app.all("/api/approvals", methodNotAllowed);
  app.all("/api/approvals/:id", methodNotAllowed);
  app.all("/api/people/:id/tokens/revoke", methodNotAllowed);
  app.on(
    ["POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    "/api/tools/:tool/user-secrets",
    methodNotAllowed,
  );
  app.on(
    ["GET", "POST", "PUT", "PATCH", "OPTIONS"],
    "/api/tools/:tool/user-secrets/:person",
    methodNotAllowed,
  );
  app.on(
    ["GET", "POST", "PUT", "PATCH", "OPTIONS"],
    "/api/tools/:tool/user-secrets/:person/:name",
    methodNotAllowed,
  );
}
