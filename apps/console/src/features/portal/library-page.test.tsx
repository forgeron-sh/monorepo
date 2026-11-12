// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { button, cleanup, click, fakeApi, mount } from "../../test-utils";
import { LibraryToolPage } from "./library-page";
import { mockLibraryCard } from "./mock";

afterEach(cleanup);

const crm = mockLibraryCard("crm", false)!;

describe("a tool's page in the person's library (D-118)", () => {
  it("shows how to use an added tool, and nothing technical", async () => {
    const { api } = fakeApi({ "/api/library/crm": crm });
    const view = await mount(<LibraryToolPage api={api} go={() => {}} tool="crm" />);
    expect(view.querySelector("[role=tab][aria-selected=true]")!.textContent).toBe("Use it");
    expect(view.textContent).toContain("In Claude");
    expect(view.textContent).toContain("https://demo.fabriks.example/t/crm/mcp");
    expect(view.textContent).toContain("forgeron crm --help");
    await click(button(view, "About"));
    expect(view.textContent).toContain("Ask Claude about your contacts and deals.");
    expect(view.textContent).not.toMatch(/version|role|action|README|resource/i);
  });

  it("adds a tool and sends the person to its setup when it asks for something", async () => {
    const assign = vi.fn<(url: string) => void>();
    vi.stubGlobal("location", { ...window.location, assign });
    const { api, sent } = fakeApi({
      "/api/library/odoo": {
        ...mockLibraryCard("odoo", false)!,
        installed: false,
        needsSetup: false,
        setupUrl: null,
      },
      "POST /api/library/odoo": {
        installed: true,
        setupUrl: "/t/odoo/setup?next=%2Flibrary%2Fodoo",
      },
    });
    const view = await mount(<LibraryToolPage api={api} go={() => {}} tool="odoo" />);
    expect(view.textContent).not.toContain("Use it");
    await click(button(view, "Add to my tools"));
    expect(sent.map((s) => `${s.method} ${s.path}`)).toEqual(["POST /api/library/odoo"]);
    expect(assign).toHaveBeenCalledWith("/t/odoo/setup?next=%2Flibrary%2Fodoo");
    vi.unstubAllGlobals();
  });

  it("asks before finishing the setup is done, then lets the person remove it after a confirmation", async () => {
    const go = vi.fn<(href: string) => void>();
    const odoo = mockLibraryCard("odoo", false)!;
    const { api, sent } = fakeApi({
      "/api/library/odoo": odoo,
      "DELETE /api/library/odoo": undefined,
    });
    const view = await mount(<LibraryToolPage api={api} go={go} tool="odoo" />);
    expect(view.textContent).toContain("One step left");
    expect(button(view, "Finish setup").getAttribute("href")).toBe(odoo.setupUrl);
    await click(button(view, "Remove"));
    expect(document.body.textContent).toContain("Your saved keys stay in your secrets");
    await click(
      [...document.querySelectorAll("[role=dialog] button")].find(
        (b) => b.textContent === "Remove",
      ),
    );
    expect(sent.map((s) => `${s.method} ${s.path}`)).toEqual(["DELETE /api/library/odoo"]);
    expect(go).toHaveBeenCalledWith("/");
  });
});

describe("a pilot in the person's library (D-119)", () => {
  it("says it is a version being tried with its own data, and adds and removes the pilot only", async () => {
    const card = { ...mockLibraryCard("odoo", false, "pilot-a")!, installed: true };
    const { api, sent } = fakeApi({
      "/api/library/odoo/pilots/pilot-a": card,
      "DELETE /api/library/odoo/pilots/pilot-a": undefined,
    });
    const view = await mount(
      <LibraryToolPage api={api} go={() => {}} tool="odoo" pilot="pilot-a" />,
    );
    expect(view.textContent).toContain("Odoo gateway · Branch · pilot-a");
    expect(view.textContent).toContain("It has its own data");
    await click(button(view, "Remove"));
    await click(
      [...document.querySelectorAll("[role=dialog] button")].find(
        (b) => b.textContent === "Remove",
      ),
    );
    expect(sent.map((s) => `${s.method} ${s.path}`)).toEqual([
      "DELETE /api/library/odoo/pilots/pilot-a",
    ]);
  });
});
