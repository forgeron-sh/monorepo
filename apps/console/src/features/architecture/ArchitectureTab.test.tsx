// @vitest-environment jsdom
import { crm } from "@forgeron/ui/architecture-fixtures";
import { afterEach, describe, expect, it, vi } from "vitest";
import { toolTabs, type ToolTabProps } from "../tools/tabs";
import "./routes";
import { ApiError } from "../../api";
import { cleanup, flush, mount } from "../../test-utils";
import ArchitectureTab, { loadManifest } from "./ArchitectureTab";

afterEach(cleanup);

const ws = {} as ToolTabProps["ws"];
const now = () => new Date("2026-11-04T10:00:00Z");

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

  it("asks for the manifest a branch's preview serves (D-120)", async () => {
    const paths: string[] = [];
    await loadManifest(async (path) => (paths.push(path), { manifest: crm }), "crm", "feat/x");
    expect(paths).toEqual(["/api/tools/crm/manifest?branch=feat%2Fx"]);
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
      <ArchitectureTab tool="crm" ws={ws} now={now} api={api(async () => ({ manifest: crm }))} />,
    );
    expect(container.querySelector("svg")?.getAttribute("aria-label")).toBe("Architecture of CRM");
    expect(container.textContent).toContain("deals");
  });

  it("says what happened, and tries again", async () => {
    const fetchJson = vi
      .fn<(path: string) => Promise<unknown>>()
      .mockRejectedValueOnce(new ApiError("/api/tools/crm/manifest: 403", 403))
      .mockResolvedValue({ manifest: crm });
    const container = await mount(
      <ArchitectureTab tool="crm" ws={ws} now={now} api={api(fetchJson)} />,
    );
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

describe("the tool page tabs", () => {
  it("has the Architecture tab for admins, loading the component, and not for members", async () => {
    expect(toolTabs(false).some((t) => t.id === "architecture")).toBe(false);
    const tab = toolTabs(true).find((t) => t.id === "architecture")!;
    expect(tab.title).toBe("Architecture");
    expect((await tab.load()).default).toBe(ArchitectureTab);
  });
});
