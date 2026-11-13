import {
  heldPermissions,
  mayAccess,
  viewSubject,
  type AccessOverrides,
  type Manifest,
  type SubjectPermissions,
} from "@forgeron/manifest";
import type { ViewBootstrap } from "@forgeron/runtime";
import type { Person } from "../kernel/person";
import { issueToken } from "../identity/authn/tokens";

// Serves a tool's views (sdk.md §7, "Isolation between tools on the same origin"). Every tool of a
// workspace shares one origin, so a view's response carries a CSP `sandbox`: the browser gives the
// page an opaque origin, with no cookies, no access to another page and no session to call an API with.
// The page calls its own tool with a short-lived token instead, bound to `<workspace>/<tool>`.

/** Without `allow-same-origin`: that is what makes the origin opaque. */
export const VIEW_CSP = "sandbox allow-scripts allow-forms allow-popups allow-downloads";

/** How long the token injected into a page lives. */
export const VIEW_TOKEN_TTL_SECONDS = 15 * 60;

/**
 * The scope of the token in the address of a page's scripts on a channel that is not production. The
 * page is sandboxed: its script requests carry no cookie, so the gateway cannot tell who asks. The
 * page, served to a person who may open it, names the right to read its scripts in their address
 * (`/_f/a/<token>/views/…`, in the path so that the imports between files keep it). The token is
 * good for these files and for nothing else.
 */
export const VIEW_ASSET_SCOPE = "view-asset";

interface ViewAsset {
  body: string | ArrayBuffer | ReadableStream;
  contentType: string;
}

/** Where the built `views/` of a tool's version are read from. */
export interface ViewAssets {
  read(file: string): Promise<ViewAsset | undefined>;
}

export interface ServeViewOptions {
  /** The gateway's signing secret. */
  secret: string;
  now: Date;
  workspace: string;
  tool: string;
  /** Where the tool is mounted on the workspace origin; `/t/<tool>` by default. */
  base?: string;
  manifest: Pick<Manifest, "views" | "profiles"> & {
    /** Only the level of each action is read. */
    actions?: Record<string, { access: string }>;
  };
  /** The matrix resolved for the person's subjects (`registry.accessFor`). */
  access?: AccessOverrides;
  /** The permissions each of the person's subjects is given (`registry.accessFor`, D-127, D-137). */
  permissions?: SubjectPermissions;
  /** Who is signed in, from the session; `undefined` if nobody. Not needed for the static files. */
  person: Person | undefined;
  assets: ViewAssets;
  /** A channel other than production: the page's scripts are asked for with a token in their address. */
  assetToken?: boolean;
}

const ASSET_PREFIX = "/_f/views/";

function secured(response: Response, extra: Record<string, string> = {}): Response {
  const headers = new Headers(response.headers);
  headers.set("content-security-policy", VIEW_CSP);
  headers.set("x-content-type-options", "nosniff");
  headers.set("referrer-policy", "no-referrer");
  for (const [name, value] of Object.entries(extra)) headers.set(name, value);
  return new Response(response.body, { status: response.status, headers });
}

const problem = (status: number, code: string, message: string, extra?: Record<string, string>) =>
  secured(Response.json({ error: { code, message } }, { status }), extra);

// `<` is escaped so that no value can close the script element that carries the JSON.
const jsonForHtml = (value: unknown) => JSON.stringify(value).replaceAll("<", "\\u003c");

const escapeAttribute = (text: string) =>
  text.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");

function pageOf(
  bootstrap: ViewBootstrap,
  title: string,
  entry: string,
  assetToken?: string,
): string {
  const scripts = assetToken ? `${bootstrap.base}/_f/a/${assetToken}` : `${bootstrap.base}/_f`;
  return [
    "<!doctype html>",
    '<html lang="en">',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    `<title>${title.replaceAll("&", "&amp;").replaceAll("<", "&lt;")}</title>`,
    '<div id="root"></div>',
    `<script id="forgeron-bootstrap" type="application/json">${jsonForHtml(bootstrap)}</script>`,
    `<script type="module" src="${escapeAttribute(`${scripts}/${entry}`)}"></script>`,
  ].join("\n");
}

/**
 * Answers a request for a view of the tool, `request` being addressed to the tool (the dispatcher
 * strips `/t/<tool>`); `undefined` when the path is not one of its views, for the tool to answer.
 *
 * - `GET <view path>`: the page, once the person holds the view's access level, with the token.
 * - `GET /_f/views/<file>`: a built file. It is public static code: a sandboxed page loads its
 *   scripts without cookies, so it cannot be asked to authenticate them.
 */
export async function serveView(
  request: Request,
  options: ServeViewOptions,
): Promise<Response | undefined> {
  const path = new URL(request.url).pathname.replace(/\/+$/, "") || "/";
  const base = options.base ?? `/t/${options.tool}`;

  if (path.startsWith(ASSET_PREFIX)) {
    if (request.method !== "GET") {
      return problem(405, "METHOD_NOT_ALLOWED", "Use GET.", { allow: "GET" });
    }
    let file: string;
    try {
      file = decodeURIComponent(path.slice("/_f/".length));
    } catch {
      return problem(404, "NOT_FOUND", "Not found.");
    }
    const segments = file.split("/");
    if (
      segments.some((part) => part === "" || part === "." || part === ".." || part.includes("\\"))
    ) {
      return problem(404, "NOT_FOUND", "Not found.");
    }
    const asset = await options.assets.read(file);
    if (!asset) return problem(404, "NOT_FOUND", "Not found.");
    return secured(new Response(asset.body), {
      "content-type": asset.contentType,
      // The page has an opaque origin: its module requests are cross-origin ones.
      "access-control-allow-origin": "*",
      "cache-control": "public, max-age=31536000, immutable",
    });
  }

  const found = Object.entries(options.manifest.views).find(([, view]) => view.path === path);
  if (!found) return undefined;
  const [name, view] = found;

  if (request.method !== "GET") {
    return problem(405, "METHOD_NOT_ALLOWED", "Use GET.", { allow: "GET" });
  }
  const { person } = options;
  if (!person) return problem(401, "UNAUTHENTICATED", "Sign in to open this page.");
  const who = {
    subjects: person.subjects,
    access: options.access,
    permissions: options.permissions,
  };
  const grants = heldPermissions(who, {
    ...options.manifest,
    actions: options.manifest.actions ?? {},
  });
  // Before anything is rendered, or a token issued: the same rule as an action's, with the
  // matrix's overrides (D-043).
  if (!mayAccess(who, options.manifest.profiles, viewSubject(name), view.access)) {
    return problem(403, "FORBIDDEN", `This page needs the "${view.access}" access level.`);
  }
  if (!view.entry) return problem(404, "NOT_FOUND", "This view was not built.");

  const token = await issueToken({
    secret: options.secret,
    person: person.id,
    workspace: options.workspace,
    tool: options.tool,
    ttlSeconds: VIEW_TOKEN_TTL_SECONDS,
    now: options.now,
  });
  const bootstrap: ViewBootstrap = {
    workspace: options.workspace,
    tool: options.tool,
    view: name,
    base,
    token,
    expiresAt: Math.floor(options.now.getTime() / 1000) + VIEW_TOKEN_TTL_SECONDS,
    user: { id: person.id, email: person.email, name: person.name, subjects: person.subjects },
    grants,
    // The actions the person may call, matrix included: what `useCanCall` reads to disable controls.
    callable: Object.entries(options.manifest.actions ?? {})
      .filter(([action, entry]) => mayAccess(who, options.manifest.profiles, action, entry.access))
      .map(([action]) => action)
      .sort(),
  };
  const assetToken = options.assetToken
    ? await issueToken({
        secret: options.secret,
        person: person.id,
        workspace: options.workspace,
        tool: options.tool,
        ttlSeconds: VIEW_TOKEN_TTL_SECONDS,
        now: options.now,
        scope: VIEW_ASSET_SCOPE,
      })
    : undefined;
  return secured(
    new Response(pageOf(bootstrap, view.title, view.entry, assetToken), {
      headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
    }),
  );
}
