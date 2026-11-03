import type { EnvironmentRecord, Registry as PlatformRegistry } from "@forgeron/registry";
import type { Registry, ToolEntry } from "./dispatch";

export interface FromRegistryOptions {
  /**
   * The Worker that serves an environment. The default names production and pilot
   * `<workspace>--<tool>--production|pilot` (docs/ARCHITECTURE.md, "Naming of Workers and
   * databases"). A preview's name is `…--pr-<n>` there, and the platform D1 does not record `<n>`:
   * until it does, a preview has no default and cannot be routed, so pass the name here.
   */
  workerNameOf?(
    tool: { workspace: string; name: string },
    environment: EnvironmentRecord,
  ): string | undefined;
}

const defaultName: NonNullable<FromRegistryOptions["workerNameOf"]> = (tool, environment) =>
  environment.name === "production" || environment.name === "pilot"
    ? `${tool.workspace}--${tool.name}--${environment.name}`
    : undefined;

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
        if (environment.name === "preview") {
          if (environment.branch) entry.previews[environment.branch] = worker;
        } else {
          entry[environment.name] = worker;
        }
      }
      return entry;
    },
  };
}
