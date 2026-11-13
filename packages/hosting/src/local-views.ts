import { heldPermissions, mayAccess, viewSubject, type Manifest } from "@forgeron/manifest";

// The views of a tool in `forgeron dev`. The gateway serves them on a platform (apps/gateway/src/views);
// here this host plays its part with the same rules: the sandbox CSP, the bootstrap in the page, the
// access level checked before anything is rendered, and the built files read from the build folder.

/** Without `allow-same-origin`: the page has an opaque origin, as it has on the platform. */
const VIEW_CSP = "sandbox allow-scripts allow-forms allow-popups allow-downloads";

/** Who the page is for: the developer of `forgeron dev`. */
interface ViewUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  subjects: string[];
  teams?: string[];
  permissions?: Record<string, string[]>;
}

const ASSET_PREFIX = "/_f/views/";
const TYPES: Record<string, string> = {
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".map": "application/json",
};

/** An opaque origin reaches its own host cross-origin: the module and the calls need CORS. */
const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, content-type",
  "access-control-allow-methods": "GET, POST, OPTIONS",
};

export const isViewCall = (path: string) => path.startsWith("/_f/call/");

export const corsHeaders = CORS;

const escapeJson = (value: unknown) => JSON.stringify(value).replaceAll("<", "\\u003c");
const escapeText = (text: string) => text.replaceAll("&", "&amp;").replaceAll("<", "&lt;");

export interface LocalViewResult {
  status: number;
  headers: Record<string, string>;
  body: string | Buffer;
}

const json = (status: number, code: string, message: string): LocalViewResult => ({
  status,
  headers: { "content-type": "application/json", "content-security-policy": VIEW_CSP, ...CORS },
  body: JSON.stringify({ error: { code, message } }),
});

/** Answers a request for a view or one of its files; `undefined` when it is for the tool's Worker. */
export async function serveLocalView(
  method: string,
  pathname: string,
  manifest: Manifest,
  user: ViewUser,
  read: (file: string) => Promise<Buffer | undefined>,
): Promise<LocalViewResult | undefined> {
  const path = pathname.replace(/\/+$/, "") || "/";

  if (path.startsWith(ASSET_PREFIX)) {
    if (method !== "GET") return json(405, "METHOD_NOT_ALLOWED", "Use GET.");
    const file = decodeURIComponent(path.slice("/_f/".length));
    if (file.split("/").some((part) => part === "" || part === "." || part === "..")) {
      return json(404, "NOT_FOUND", "Not found.");
    }
    const content = await read(file);
    if (!content) return json(404, "NOT_FOUND", "Not found.");
    const type = TYPES[file.slice(file.lastIndexOf("."))] ?? "application/octet-stream";
    return {
      status: 200,
      headers: { "content-type": type, "content-security-policy": VIEW_CSP, ...CORS },
      body: content,
    };
  }

  const found = Object.entries(manifest.views).find(([, view]) => view.path === path);
  if (!found) return undefined;
  const [name, view] = found;
  if (method !== "GET") return json(405, "METHOD_NOT_ALLOWED", "Use GET.");

  const who = { subjects: user.subjects, permissions: user.permissions };
  const shape = { ...manifest, actions: manifest.actions ?? {} };
  if (!mayAccess(who, manifest.profiles, viewSubject(name), view.access)) {
    return json(403, "FORBIDDEN", `This page needs the "${view.access}" access level.`);
  }
  if (!view.entry) return json(404, "NOT_FOUND", "This view was not built.");

  const bootstrap = {
    workspace: "local",
    tool: manifest.name,
    view: name,
    base: "",
    // No token locally: the Worker trusts the host, which gives it the developer's identity.
    token: `local:${user.email}`,
    expiresAt: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      ...(user.avatar ? { avatar: user.avatar } : {}),
      ...(user.teams ? { teams: user.teams } : {}),
    },
    grants: heldPermissions(who, shape),
    callable: Object.entries(manifest.actions ?? {})
      .filter(([action, entry]) => mayAccess(who, manifest.profiles, action, entry.access))
      .map(([action]) => action)
      .sort(),
  };
  return {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "content-security-policy": VIEW_CSP,
      "cache-control": "no-store",
    },
    body: [
      "<!doctype html>",
      '<html lang="en">',
      '<meta charset="utf-8">',
      '<meta name="viewport" content="width=device-width, initial-scale=1">',
      `<title>${escapeText(view.title)}</title>`,
      "<style>html,body{margin:0}</style>",
      '<div id="root"></div>',
      `<script id="forgeron-bootstrap" type="application/json">${escapeJson(bootstrap)}</script>`,
      `<script type="module" src="/_f/${view.entry}"></script>`,
    ].join("\n"),
  };
}
