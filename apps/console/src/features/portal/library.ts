import { addresses } from "@forgeron/platform-contract/client";
import { ok, typedClient, typedSender, type FetchJson, type SendJson } from "../../api";

// A person's library (D-117): the calls of Home and of a tool's page in the library, through the
// contract's typed client. Nothing technical comes back: no version, role, action or resource.

export async function loadLibrary(fetchJson: FetchJson) {
  return ok(await typedClient(fetchJson)(addresses.listLibrary)).tools;
}
export type LibraryTool = Awaited<ReturnType<typeof loadLibrary>>[number];

export async function addToLibrary(send: SendJson, tool: string) {
  return ok(await typedSender(send)(addresses.installLibraryTool, { params: { tool } }));
}

/** The tool's page in the person's library. */
export const libraryHref = (tool: string) => `/library/${encodeURIComponent(tool)}`;
