import { workerName } from "@forgeron/hosting";
import type { EnvironmentRecord, Registry as PlatformRegistry } from "@forgeron/registry";
import { describe, expect, it } from "vitest";
import { dispatchRegistry } from "./from-registry";

const tool = { id: "t1", workspace: "demo", name: "crm" };
const environment = (over: Partial<EnvironmentRecord>): EnvironmentRecord =>
  ({
    id: "e",
    toolId: "t1",
    name: "production",
    versionId: "v1",
    url: "u",
    ...over,
  }) as EnvironmentRecord;

const platform = (environments: EnvironmentRecord[]) =>
  ({
    findTool: async () => tool,
    listEnvironments: async () => environments,
  }) as unknown as PlatformRegistry;

describe("dispatchRegistry", () => {
  it("routes production, a preview and a permanent channel to the Workers self-host deployed", async () => {
    const entry = await dispatchRegistry(
      platform([
        environment({ name: "production" }),
        environment({ name: "preview", branch: "feat/Export 2" }),
        environment({ name: "channel", channel: "staging" }),
      ]),
    ).find("demo", "crm");
    expect(entry).toEqual({
      production: "demo--crm--production",
      previews: {
        "~staging": "demo--crm--channel-staging",
        "feat/Export 2": workerName("demo", {
          tool: "crm",
          name: "preview",
          branch: "feat/Export 2",
        }),
      },
    });
    expect(entry?.previews["feat/Export 2"]).toMatch(
      /^demo--crm--preview-feat-export-2-[0-9a-f]{6}$/,
    );
  });

  it("does not route an environment that serves no version", async () => {
    const entry = await dispatchRegistry(
      platform([environment({ name: "preview", branch: "x", versionId: undefined })]),
    ).find("demo", "crm");
    expect(entry?.previews).toEqual({});
  });
});
