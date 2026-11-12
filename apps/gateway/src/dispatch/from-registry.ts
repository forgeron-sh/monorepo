import { workerName } from "@forgeron/hosting";
import {
  channelRef,
  hostingTargetOf,
  type EnvironmentRecord,
  type Registry as PlatformRegistry,
} from "@forgeron/registry";
import type { Registry, ToolEntry } from "./dispatch";

export interface FromRegistryOptions {
  /**
   * The Worker that serves an environment. The default is the name self-host gives it
   * (`workerName` of `@forgeron/hosting`: `<workspace>--<tool>--production`, and for a
   * preview `<workspace>--<tool>--preview-<branch>-<hash>`; docs/ARCHITECTURE.md, "Naming of Workers
   * and databases"), so the gateway reaches the Worker that was deployed. Cloud hosting names its
   * own Workers: pass its naming here.
   */
  workerNameOf?(
    tool: { workspace: string; name: string },
    environment: EnvironmentRecord,
  ): string | undefined;
}

const defaultName: NonNullable<FromRegistryOptions["workerNameOf"]> = (tool, environment) =>
  workerName(tool.workspace, hostingTargetOf(tool.name, environment));

/**
 * The dispatcher's view of the platform D1: only an environment that serves a version (activated)
 * is routable; an environment that was created but never activated answers 404.
 */
export function dispatchRegistry(
  registry: PlatformRegistry,
  options: FromRegistryOptions = {},
): Registry {
  const nameOf = options.workerNameOf ?? defaultName;
  return {
    async find(workspace, name) {
      const tool = await registry.findTool(workspace, name);
      if (!tool) return undefined;
      const entry: ToolEntry = { previews: {} };
      for (const environment of await registry.listEnvironments(tool.id)) {
        if (!environment.versionId) continue;
        const worker = nameOf(tool, environment);
        if (!worker) continue;
        if (environment.name === "production") {
          entry.production = worker;
        } else {
          // A branch's temporary channel, or `~<name>` for another permanent channel (D-125).
          const ref = channelRef(environment);
          if (ref && ref !== "~") entry.previews[ref] = worker;
        }
      }
      return entry;
    },
  };
}
