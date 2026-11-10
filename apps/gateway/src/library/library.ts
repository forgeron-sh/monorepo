// Whether a person may reach a tool, and whether they still have something to give it (D-117). Used
// by the dispatcher, the MCP sign-in and the library routes, so the three say the same thing.
import { missingSetup } from "@forgeron/runtime";
import { isAvailable, type Registry } from "@forgeron/registry";

type Port = Pick<
  Registry,
  "availabilityOf" | "isInstalled" | "currentManifest" | "readUserSecrets" | "readUserSetup"
>;

export interface LibraryPerson {
  id: string;
  roles: readonly string[];
}

/**
 * `ok` for a tool with no rule (open as before) or one in the person's library that they may still
 * use; otherwise why not: `unavailable` (an admin has not opened it to them) or `not-installed`.
 */
export async function libraryAccess(
  registry: Port,
  toolId: string,
  person: LibraryPerson,
): Promise<"ok" | "unavailable" | "not-installed"> {
  const rule = await registry.availabilityOf(toolId);
  if (!rule) return "ok";
  if (!isAvailable(rule, person)) return "unavailable";
  return (await registry.isInstalled(toolId, person.id)) ? "ok" : "not-installed";
}

/** Whether the person still has a field or a secret to give the tool before it works (D-097). */
export async function needsSetup(registry: Port, toolId: string, person: string): Promise<boolean> {
  let manifest;
  try {
    manifest = await registry.currentManifest(toolId);
  } catch {
    return false;
  }
  const secrets = await registry.readUserSecrets(toolId, person).catch(() => ({}));
  const setup = await registry.readUserSetup(toolId, person);
  const missing = missingSetup(manifest, { setup, secrets });
  return missing.fields.length > 0 || missing.secrets.length > 0;
}

/** The console page where a person adds or uses a tool. */
export const libraryPath = (tool: string) => `/library/${encodeURIComponent(tool)}`;

/** Where a person finishes a tool's setup, coming back to the tool's page of their library. */
export const setupPath = (tool: string) =>
  `/t/${encodeURIComponent(tool)}/setup?next=${encodeURIComponent(libraryPath(tool))}`;
