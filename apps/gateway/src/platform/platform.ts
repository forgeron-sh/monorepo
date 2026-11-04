import { mountAccessMatrix } from "./access-matrix";
import { mountApprovals } from "./approvals";
import { mountCatalog } from "./catalog";
import { mountConnections } from "./connections";
import { mountDatabase } from "./database";
import { mountIdentity } from "./identity";
import { mountMembers } from "./members";
import { mountSecrets } from "./secrets";
import { mountTools } from "./tools";
import { mountWorkspace } from "./workspace";
import { createPlatformApp, memberOnly } from "./app";

/** The platform API: the shell with every route that has moved to the contract so far. */
export function createPlatform() {
  const app = createPlatformApp();
  mountCatalog(app);
  mountTools(app);
  mountWorkspace(app);
  mountAccessMatrix(app);
  mountConnections(app);
  mountDatabase(app);
  mountMembers(app);
  mountIdentity(app);
  mountSecrets(app);
  mountApprovals(app);

  // The OpenAPI 3.1 document of what is mounted above, for any signed-in member, like the catalog:
  // it describes the API a member's own console calls, and an anonymous visitor has no use for it.
  let document: unknown;
  app.get("/api/openapi.json", memberOnly, (c) =>
    c.json(
      (document ??= app.getOpenAPI31Document({
        openapi: "3.1.0",
        info: { title: "Forgeron platform API", version: "0.0.0" },
        servers: [{ url: "/console-api" }],
      })),
    ),
  );
  return app;
}
