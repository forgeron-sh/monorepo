// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { button, cleanup, click, fakeApi, field, mount, type } from "../../test-utils";
import TeamsPage from "./pages/teams";

afterEach(cleanup);

const members = {
  members: [
    { id: "m1", email: "ada@acme.fr", name: "Ada", roles: ["admin"] },
    { id: "m2", email: "bob@acme.fr", name: "Bob", roles: [] },
  ],
  invitations: [],
  settings: { domains: [], source: "install" },
};
const team = {
  id: "product",
  name: "Product",
  description: "",
  members: ["m1"],
  role: "team-product",
};

const page = (api: ReturnType<typeof fakeApi>["api"]) =>
  mount(<TeamsPage api={api} ws={{} as never} go={() => {}} now={() => new Date()} />);

describe("Teams", () => {
  it("lists the teams with their members' names", async () => {
    const { api } = fakeApi({ "/api/teams": { teams: [team] }, "/api/members": members });
    const view = await page(api);
    expect(view.textContent).toContain("Product");
    expect(view.textContent).toContain("Ada");
  });

  it("creates a team whose address follows its name, with the members picked", async () => {
    const { api, sent } = fakeApi({
      "/api/teams": { teams: [] },
      "/api/members": members,
      "POST /api/teams": () => ({ ...team, id: "design-brand" }),
    });
    const view = await page(api);
    expect(view.textContent).toContain("No team yet");
    await click(button(view, "New team"));
    const dialog = document.querySelector("[role=dialog]")!;
    await type(field(dialog, "Name"), "Design & Brand");
    await click([...dialog.querySelectorAll("input[type=checkbox]")][1]);
    await click(button(dialog as HTMLElement, "Create team"));
    expect(sent).toEqual([
      {
        path: "/api/teams",
        method: "POST",
        body: { id: "design-brand", name: "Design & Brand", description: "", members: ["m2"] },
      },
    ]);
  });
});
