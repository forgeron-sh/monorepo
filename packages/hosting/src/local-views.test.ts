import type { Manifest } from "@forgeron/manifest";
import { describe, expect, it } from "vitest";
import { serveLocalView } from "./local-views";

const manifest = {
  name: "notes",
  roles: { member: { grants: ["read", "write"], default: true } },
  actions: { "notes.list": { access: "read" }, "notes.create": { access: "write" } },
  views: {
    notes: { title: "Notes", path: "/", access: "read", entry: "views/notes.js" },
    admin: { title: "Admin", path: "/admin", access: "admin", entry: "views/admin.js" },
  },
  resources: {},
} as unknown as Manifest;
const user = { id: "u1", email: "ely@acme.fr", name: "Ely", roles: ["member"], teams: ["product"] };
const files = new Map([["views/notes.js", Buffer.from("export default 1")]]);
const read = async (file: string) => files.get(file);

describe("serveLocalView", () => {
  it("serves the page with the sandbox CSP and the bootstrap: the person, their teams, what they may call", async () => {
    const page = (await serveLocalView("GET", "/", manifest, user, read))!;
    expect(page.status).toBe(200);
    expect(page.headers["content-security-policy"]).toContain("sandbox allow-scripts");
    expect(page.headers["content-security-policy"]).not.toContain("allow-same-origin");
    const html = String(page.body);
    expect(html).toContain('<script type="module" src="/_f/views/notes.js">');
    const json = html.match(/id="forgeron-bootstrap" type="application\/json">(.*)<\/script>/)![1]!;
    const bootstrap = JSON.parse(json) as {
      user: { teams: string[] };
      callable: string[];
      grants: string[];
    };
    expect(bootstrap.user.teams).toEqual(["product"]);
    expect(bootstrap.callable).toEqual(["notes.create", "notes.list"]);
    expect(bootstrap.grants).toEqual(["read", "write"]);
  });

  it("checks the access level before rendering anything", async () => {
    const refused = (await serveLocalView("GET", "/admin", manifest, user, read))!;
    expect(refused.status).toBe(403);
    expect(String(refused.body)).not.toContain("forgeron-bootstrap");
  });

  it("serves built files with CORS (an opaque origin), refuses a path that climbs, and leaves the rest to the Worker", async () => {
    const file = (await serveLocalView("GET", "/_f/views/notes.js", manifest, user, read))!;
    expect(file.status).toBe(200);
    expect(file.headers["access-control-allow-origin"]).toBe("*");
    expect(
      (await serveLocalView("GET", "/_f/views/../worker.js", manifest, user, read))!.status,
    ).toBe(404);
    expect((await serveLocalView("GET", "/_f/views/none.js", manifest, user, read))!.status).toBe(
      404,
    );
    expect(await serveLocalView("GET", "/api/notes.list", manifest, user, read)).toBeUndefined();
    expect((await serveLocalView("POST", "/", manifest, user, read))!.status).toBe(405);
  });
});
