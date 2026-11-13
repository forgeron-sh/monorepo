import { mountAccessMatrix } from "./access-matrix";
import { mountApprovals } from "./approvals";
import { mountBearer } from "./bearer";
import { mountCatalog } from "./catalog";
import { mountConnections } from "./connections";
import { mountConsent } from "./consent";
import { mountDatabase } from "./database";
import { mountDatabaseAdmin } from "./database-admin";
import { mountGithub } from "./github";
import { mountIdentity } from "./identity";
import { mountMembers } from "./members";
import { mountTeams } from "./teams";
import { mountSecretRequests } from "./secret-requests";
import { mountSecrets } from "./secrets";
import { mountLibrary } from "./library";
import { mountMarketplaces } from "./marketplaces";
import { mountSources } from "./sources";
import { mountTemplates } from "./templates";
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
  mountDatabaseAdmin(app);
  mountMembers(app);
  mountTeams(app);
  mountIdentity(app);
  mountSecrets(app);
  mountSecretRequests(app);
  mountApprovals(app);
  mountTemplates(app);
  mountMarketplaces(app);
  mountLibrary(app);
  mountSources(app);
  mountBearer(app);
  mountGithub(app);
  mountConsent(app);

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
