import { ViewHost, type ViewRuntime } from "@forgeron/sdk/react";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import monday from "../views/monday";

function runtime(search: Record<string, string>, levels: string[]): ViewRuntime {
  return {
    user: { id: "u", email: "mia@acme.fr", name: "Mia", roles: ["management"] },
    can: (level) => levels.includes(level),
    call: async () => null,
    params: { get: () => search, set: () => {}, subscribe: () => () => {} },
  };
}
const render = (search: Record<string, string>, levels = ["read", "management"]) =>
  renderToString(createElement(ViewHost, { view: monday, runtime: runtime(search, levels) }));

describe("views/monday.tsx", () => {
  it("is served at /monday for the management level", () => {
    expect(monday).toMatchObject({ path: "/monday", access: "management" });
  });

  it("renders the page with its figures while they load", () => {
    const html = render({ owner: "ely@acme.fr" });
    expect(html).toContain("Monday meeting");
    expect(html).toContain("Won this month");
    expect(html).toContain("Leads by stage");
    expect(html).toContain("Last activity");
    expect(html).toContain("Salesperson");
  });

  it("shows the person the filter of the link", () => {
    expect(render({ owner: "ely@acme.fr" })).toMatch(/<select[^>]*>/);
  });

  it("refuses a person without the management level (read is not enough), and a filter that is not an email", () => {
    expect(render({}, [])).toContain("Access denied");
    expect(render({}, ["read"])).toContain("Access denied");
    expect(render({ owner: "not-an-email" })).toContain("Invalid parameters");
  });
});
