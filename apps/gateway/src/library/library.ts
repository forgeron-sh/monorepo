// Whether a person may reach a tool, and whether they still have something to give it (D-117). Used
// by the dispatcher, the MCP sign-in and the library routes, so the three say the same thing.
import { missingSetup } from "@forgeron/runtime";
import type { Manifest } from "@forgeron/manifest";
import {
  channelRef,
  isAvailable,
  mayUseChannel,
  reachesChannelAlways,
  type Registry,
} from "@forgeron/registry";
import { channelPath } from "../tool-address";

type Port = Pick<
  Registry,
  "availabilityOf" | "isInstalled" | "currentManifest" | "readUserSecrets" | "readUserSetup"
>;

type PilotPort = Pick<
  Registry,
  | "channelAccessOf"
  | "isChannelInstalled"
  | "listEnvironments"
  | "getVersion"
  | "getBuild"
  | "readUserSecrets"
  | "readUserSetup"
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

// ---- channels other than production (D-119, D-125): opened to people, each with its own database.
// `branch` here is the channel's reference: a branch, or `~<name>` for a permanent channel.

/**
 * May this person reach a channel other than production? Admins always may, developers on a branch's
 * temporary channel (sdk.md §7, D-129); anyone else only when an admin published the channel to them
 * and they added it to their library.
 */
export async function pilotAccess(
  registry: Pick<PilotPort, "channelAccessOf" | "isChannelInstalled">,
  toolId: string,
  branch: string,
  person: LibraryPerson,
): Promise<boolean> {
  if (reachesChannelAlways(branch, person)) return true;
  const rule = await registry.channelAccessOf(toolId, branch);
  if (!rule || !mayUseChannel(rule, person, branch)) return false;
  return registry.isChannelInstalled(toolId, branch, person.id);
}

/** The manifest a channel serves, or `undefined` when it serves nothing. */
export async function previewManifest(
  registry: Pick<PilotPort, "listEnvironments" | "getVersion" | "getBuild">,
  toolId: string,
  branch: string,
): Promise<Manifest | undefined> {
  const env = (await registry.listEnvironments(toolId)).find(
    (e) => e.name !== "production" && channelRef(e) === branch && e.versionId,
  );
  const version = env?.versionId ? await registry.getVersion(env.versionId) : undefined;
  const build = version ? await registry.getBuild(version.buildId) : undefined;
  return build ? (build.manifest as Manifest) : undefined;
}

/** Whether the person still has something to give the channel's version before it works. */
export async function pilotNeedsSetup(
  registry: PilotPort,
  toolId: string,
  branch: string,
  person: string,
): Promise<boolean> {
  const manifest = await previewManifest(registry, toolId, branch);
  if (!manifest) return false;
  const secrets = await registry
    .readUserSecrets(toolId, person, { environment: "preview", branch })
    .catch(() => ({}));
  const setup = await registry.readUserSetup(toolId, person);
  const missing = missingSetup(manifest, { setup, secrets });
  return missing.fields.length > 0 || missing.secrets.length > 0;
}

const pilotPath = (tool: string, branch: string) =>
  `${libraryPath(tool)}/pilots/${encodeURIComponent(branch)}`;

export const pilotSetupPath = (tool: string, branch: string) =>
  `${channelPath(tool, branch)}/setup?next=${encodeURIComponent(pilotPath(tool, branch))}`;
