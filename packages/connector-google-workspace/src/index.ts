import { defineConnector } from "@forgeron/sdk";

const SCOPE = "https://www.googleapis.com/auth/";

// The OAuth scopes a tool may ask for, as Google publishes them. A tool that declares another
// one is refused at build. Add one here when a tool needs it.
export const googleWorkspaceScopes = [
  "gmail.readonly",
  "gmail.send",
  "gmail.modify",
  "calendar",
  "calendar.readonly",
  "calendar.events",
  "drive",
  "drive.readonly",
  "drive.file",
  "spreadsheets",
  "spreadsheets.readonly",
  "documents",
  "documents.readonly",
].map((name) => `${SCOPE}${name}`);

/**
 * `connector("google-workspace", { mode, scopes, why })`. No Google client is bundled: the
 * connector exposes an authenticated `fetch` limited to the Google APIs
 * (`ctx.connectors.google.fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages")`).
 */
export const googleWorkspace = defineConnector({
  type: "google-workspace",
  hosts: ["*.googleapis.com"],
  modes: ["delegated", "application"],
  scopes: googleWorkspaceScopes,
});

/** The definition `forgeron build` bundles: the same as `googleWorkspace` (D-048). @alias */
export default googleWorkspace;
