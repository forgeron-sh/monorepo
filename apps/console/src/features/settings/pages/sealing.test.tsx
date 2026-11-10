// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { button, cleanup, click, fakeApi, mount, refusal } from "../../../test-utils";
import SealingPage from "./sealing";

afterEach(cleanup);

describe("the sealing key page", () => {
  it("seals again on a click and shows only the counts", async () => {
    const { api, sent } = fakeApi({
      "POST /api/secrets/reseal": { resealed: 4, current: 2, unreadable: 0 },
    });
    const page = await mount(<SealingPage api={api} />);
    await click(button(page, "Seal again"));
    expect(sent).toEqual([{ path: "/api/secrets/reseal", body: undefined, method: "POST" }]);
    expect(page.textContent).toContain("4 sealed again, 2 already current, 0 unreadable");
  });

  it("warns about a value no key opens", async () => {
    const { api } = fakeApi({
      "POST /api/secrets/reseal": { resealed: 0, current: 0, unreadable: 3 },
    });
    const page = await mount(<SealingPage api={api} />);
    await click(button(page, "Seal again"));
    expect(page.textContent).toContain("3 unreadable");
    expect(page.textContent).toContain("must be typed again");
  });

  it("says when the gateway has no key", async () => {
    const { api } = fakeApi({
      "POST /api/secrets/reseal": () => {
        throw refusal(409, "The gateway has no `SECRETS_KEY`.");
      },
    });
    const page = await mount(<SealingPage api={api} />);
    await click(button(page, "Seal again"));
    expect(page.textContent).toContain("The gateway has no `SECRETS_KEY`.");
  });
});
