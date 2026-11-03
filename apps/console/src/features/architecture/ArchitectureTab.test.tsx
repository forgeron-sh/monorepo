// @vitest-environment jsdom
import { crm } from "@forgeron/ui/architecture-fixtures";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../../api";
import { cleanup, flush, mount } from "../../test-utils";
import { ArchitectureTab, loadManifest } from "./ArchitectureTab";
import { architectureTab, registerArchitectureTab, type ToolTabRegistration } from "./register";

afterEach(cleanup);

const api = (fetchJson: (path: string) => Promise<unknown>) => ({
  fetchJson,
  sendJson: async () => ({}),
});

describe("loadManifest", () => {
  it("asks for the manifest of the tool", async () => {
    const paths: string[] = [];
    const manifest = await loadManifest(
      async (path) => (paths.push(path), { manifest: crm }),
      "crm",
    );
    expect(paths).toEqual(["/api/tools/crm/manifest"]);
    expect(manifest.name).toBe("crm");
  });

  it("refuses an answer that is not a manifest", async () => {
    await expect(loadManifest(async () => ({ manifest: { name: "crm" } }), "crm")).rejects.toThrow(
      "without a manifest",
    );
    await expect(loadManifest(async () => ({}), "crm")).rejects.toThrow("without a manifest");
  });
});

describe("ArchitectureTab", () => {
  it("draws the diagram of the manifest", async () => {
    const container = await mount(
      <ArchitectureTab tool="crm" api={api(async () => ({ manifest: crm }))} />,
    );
    expect(container.querySelector("svg")?.getAttribute("aria-label")).toBe("Architecture of CRM");
    expect(container.textContent).toContain("deals");
  });

  it("says what happened, and tries again", async () => {
    const fetchJson = vi
      .fn<(path: string) => Promise<unknown>>()
      .mockRejectedValueOnce(new ApiError("/api/tools/crm/manifest: 403", 403))
      .mockResolvedValue({ manifest: crm });
    const container = await mount(<ArchitectureTab tool="crm" api={api(fetchJson)} />);
    expect(container.textContent).toContain("The architecture could not be loaded.");
    const retry = [...container.querySelectorAll("button")].find(
      (b) => b.textContent === "Try again",
    )!;
    retry.click();
    await flush();
    expect(container.querySelector("svg")).not.toBeNull();
    expect(fetchJson).toHaveBeenCalledTimes(2);
  });
});

describe("registerArchitectureTab", () => {
  it("hands the registry one admin-only tab", () => {
    const register = vi.fn<(tab: ToolTabRegistration) => void>();
    registerArchitectureTab(register);
    expect(register).toHaveBeenCalledWith(architectureTab);
    expect(architectureTab).toMatchObject({
      id: "architecture",
      title: "Architecture",
      adminOnly: true,
    });
  });
});
