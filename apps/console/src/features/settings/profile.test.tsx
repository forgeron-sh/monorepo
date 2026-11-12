// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { button, cleanup, click, fakeApi, mount } from "../../test-utils";
import type { WorkspaceInfo } from "../../workspace";
import ProfilePage from "./pages/profile";

vi.mock("./avatar-image", () => ({ avatarDataUrl: async () => "data:image/webp;base64,AAAA" }));

afterEach(cleanup);

const ws = (avatar?: WorkspaceInfo["person"]["avatar"]): WorkspaceInfo => ({
  workspace: "demo",
  endpoint: "https://demo.example.test",
  person: {
    id: "m1",
    email: "ada@acme.fr",
    name: "Ada Lovelace",
    roles: ["admin"],
    admin: true,
    ...(avatar ? { avatar } : {}),
  },
  setup: { members: 1, invitations: 0, tools: 0, deployed: 0, called: false },
});
const page = (info: WorkspaceInfo, api: ReturnType<typeof fakeApi>["api"]) =>
  mount(<ProfilePage ws={info} api={api} go={() => {}} now={() => new Date()} params={{}} />);

describe("Profile picture (D-133)", () => {
  it("says where the picture comes from, and offers to remove only the one you chose", async () => {
    const { api } = fakeApi({});
    const provider = await page(
      ws({ url: "https://demo.example.test/avatars/m1?v=1", source: "provider" }),
      api,
    );
    expect(provider.textContent).toContain("From your sign-in provider");
    expect(provider.querySelector("img")?.getAttribute("src")).toContain("/avatars/m1");
    expect(button(provider, "Remove")).toBeUndefined();
    await cleanup();
    const custom = await page(
      ws({ url: "https://demo.example.test/avatars/m1?v=2", source: "custom" }),
      api,
    );
    expect(button(custom, "Remove")).toBeTruthy();
  });

  it("gives the picture back to the provider's with null", async () => {
    const { api, sent } = fakeApi({ "PUT /api/me/avatar": { avatar: null } });
    const view = await page(
      ws({ url: "https://demo.example.test/avatars/m1?v=2", source: "custom" }),
      api,
    );
    await click(button(view, "Remove"));
    expect(sent).toEqual([{ path: "/api/me/avatar", method: "PUT", body: { image: null } }]);
    expect(view.querySelector("img")).toBeNull();
    expect(button(view, "Choose a picture")).toBeTruthy();
  });

  it("sends the picture that was chosen, once cropped by the browser", async () => {
    const { api, sent } = fakeApi({
      "PUT /api/me/avatar": {
        avatar: { url: "https://demo.example.test/avatars/m1?v=3", source: "custom" },
      },
    });
    const view = await page(ws(), api);
    const file = view.querySelector<HTMLInputElement>("input[type=file]")!;
    Object.defineProperty(file, "files", {
      value: [new File(["x"], "me.png", { type: "image/png" })],
    });
    file.dispatchEvent(new Event("change", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 0));
    expect(sent[0]).toMatchObject({
      path: "/api/me/avatar",
      body: { image: "data:image/webp;base64,AAAA" },
    });
  });
});
