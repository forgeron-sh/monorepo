// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fakeApi, field, mount, NOW, refusal, submit, type } from "../../../test-utils";
import SecretRequestPage from "./secret-request";
import type { PageProps } from "../../../shell/page-props";
import type { Api } from "../../../api";

afterEach(cleanup);

// The values are test values. The token is made up, and is not the one of a real link.
const TOKEN = "t".repeat(43);
const VALUE = "typed-by-the-person-test-value";
const target = {
  tool: "hr",
  environment: "production",
  name: "HR_KEY",
  expiresAt: new Date(NOW.getTime() + 10 * 60_000).toISOString(),
};

const props = (api: Api): PageProps =>
  ({ api, now: () => NOW, go: () => {}, params: {}, refreshPending: () => {} }) as never;
const open = (hash: string) => window.history.replaceState(null, "", `/secret-request${hash}`);
beforeEach(() => open(`#${TOKEN}`));

describe("the secret request page", () => {
  it("says what to do when there is no link, and calls nothing", async () => {
    open("");
    const { api, sent } = fakeApi({});
    const page = await mount(<SecretRequestPage {...props(api)} />);
    expect(page.textContent).toContain("Open the link you were given");
    expect(sent).toEqual([]);
  });

  it("takes the token out of the address, asks where the secret goes, and masks the input", async () => {
    const { api, sent } = fakeApi({ "POST /api/secret-requests/lookup": target });
    const page = await mount(<SecretRequestPage {...props(api)} />);
    expect(window.location.hash).toBe("");
    expect(window.location.href).not.toContain(TOKEN);
    expect(sent).toEqual([
      { path: "/api/secret-requests/lookup", body: { token: TOKEN }, method: "POST" },
    ]);
    expect(page.textContent).toContain("hr");
    expect(page.textContent).toContain("HR_KEY");
    const input = field(page, "HR_KEY");
    expect(input.type).toBe("password");
    expect(input.autocomplete).toBe("off");
  });

  it("sends the value in a body once, then empties the field and shows it nowhere", async () => {
    const { api, sent } = fakeApi({
      "POST /api/secret-requests/lookup": target,
      "POST /api/secret-requests/fulfil": undefined,
    });
    const page = await mount(<SecretRequestPage {...props(api)} />);
    await type(field(page, "HR_KEY"), VALUE);
    await submit(page.querySelector("form"));
    expect(sent.at(-1)).toEqual({
      path: "/api/secret-requests/fulfil",
      body: { token: TOKEN, value: VALUE },
      method: "POST",
    });
    // Nothing but the body carries it: no path, no address, no text, no field left.
    expect(sent.map((s) => s.path).join()).not.toContain(VALUE);
    expect(window.location.href).not.toContain(VALUE);
    expect(page.textContent).toContain("HR_KEY is set for hr, in production");
    expect(page.textContent).not.toContain(VALUE);
    expect(page.querySelector("input")).toBeNull();
    expect(page.innerHTML).not.toContain(VALUE);
  });

  it("keeps the person on the form with a message when the platform refuses, and shows no value", async () => {
    const { api } = fakeApi({
      "POST /api/secret-requests/lookup": target,
      "POST /api/secret-requests/fulfil": () => {
        throw refusal(410);
      },
    });
    const page = await mount(<SecretRequestPage {...props(api)} />);
    await type(field(page, "HR_KEY"), VALUE);
    await submit(page.querySelector("form"));
    expect(page.textContent).toContain("This link expired");
    expect(page.textContent).not.toContain(VALUE);
  });

  it.each([
    [404, "does not work for you"],
    [410, "expired"],
  ])("explains a link the platform answers %i for, with no form", async (status, words) => {
    const { api } = fakeApi({
      "POST /api/secret-requests/lookup": () => {
        throw refusal(status);
      },
    });
    const page = await mount(<SecretRequestPage {...props(api)} />);
    expect(page.textContent).toContain(words);
    expect(page.querySelector("input")).toBeNull();
  });
});
