// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, mount } from "../../../test-utils";
import PersonalSecretsPage from "./personal-secrets";

afterEach(cleanup);

describe("personal secrets in the console", () => {
  it("leads to the gateway's page of the person's own secrets", async () => {
    const page = await mount(<PersonalSecretsPage />);
    expect(page.querySelector("a")?.getAttribute("href")).toBe("/my/secrets");
  });
});
