import { addresses } from "@forgeron/platform-contract/client";
import { ok, typedClient, typedSender, type FetchJson, type SendJson } from "../../api";

// A person's library (D-117): the calls of Home and of a tool's page in the library, through the
// contract's typed client. Nothing technical comes back: no version, role, action or resource.

export async function loadLibrary(fetchJson: FetchJson) {
  return ok(await typedClient(fetchJson)(addresses.listLibrary)).tools;
}
export type LibraryTool = Awaited<ReturnType<typeof loadLibrary>>[number];

export async function loadLibraryCard(fetchJson: FetchJson, tool: string) {
  return ok(await typedClient(fetchJson)(addresses.libraryCard, { params: { tool } }));
}
export type LibraryCard = Awaited<ReturnType<typeof loadLibraryCard>>;

export async function addToLibrary(send: SendJson, tool: string) {
  return ok(await typedSender(send)(addresses.installLibraryTool, { params: { tool } }));
}

export async function removeFromLibrary(send: SendJson, tool: string) {
  ok(await typedSender(send)(addresses.uninstallLibraryTool, { params: { tool } }));
}

/** The tool's page in the person's library; a pilot's (D-119) when a branch is given. */
export const libraryHref = (tool: string, pilot?: string | null) =>
  `/library/${encodeURIComponent(tool)}${pilot ? `/pilots/${encodeURIComponent(pilot)}` : ""}`;

// ---- pilots (D-119): a version being tried on a branch, with its own data

export async function loadPilotCard(fetchJson: FetchJson, tool: string, branch: string) {
  return ok(await typedClient(fetchJson)(addresses.pilotCard, { params: { tool, branch } }));
}

export async function addPilot(send: SendJson, tool: string, branch: string) {
  return ok(await typedSender(send)(addresses.installPilot, { params: { tool, branch } }));
}

export async function removePilot(send: SendJson, tool: string, branch: string) {
  ok(await typedSender(send)(addresses.uninstallPilot, { params: { tool, branch } }));
}
