import type { Manifest } from "@forgeron/manifest";
import { playgroundHtml } from "@forgeron/playground";
import type { Person } from "../identity/authenticate";

// The playground of a tool, at `/t/<tool>/play` (sdk.md §7). It is Forgeron's own page, served at the
// workspace origin like the console: it calls the tool's `/api`, `/mcp` and `/cli` with the person's
// session, so every call goes through the access check like any other. What it lists is cut to what
// the person can run, and a person with no access to the tool does not get the page at all.

export interface ServePlaygroundOptions {
  /** Where the tool is mounted on the workspace origin; `/t/<tool>` by default. */
  base?: string;
  tool: string;
  manifest: Manifest;
  /** Who is signed in, from the session; `undefined` if nobody. */
  person: Person | undefined;
}

// The page has inline script and style, and talks to its own origin only.
const PAGE_CSP =
  "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'";

function problem(
  status: number,
  code: string,
  message: string,
  headers: Record<string, string> = {},
) {
  return Response.json(
    { error: { code, message } },
    { status, headers: { "cache-control": "no-store", ...headers } },
  );
}

/**
 * Answers `GET /play` (the page) and `GET /play/manifest` (what the person can run), the request
 * being addressed to the tool; `undefined` for any other path, for the tool to answer.
 */
export function servePlayground(
  request: Request,
  options: ServePlaygroundOptions,
): Response | undefined {
  const path = new URL(request.url).pathname.replace(/\/+$/, "") || "/";
  if (path !== "/play" && path !== "/play/manifest") return undefined;
  if (request.method !== "GET")
    return problem(405, "METHOD_NOT_ALLOWED", "Use GET.", { allow: "GET" });

  const { person, manifest } = options;
  if (!person) return problem(401, "UNAUTHENTICATED", "Sign in to open the playground.");
  const grants = new Set(person.roles.flatMap((role) => manifest.roles[role]?.grants ?? []));
  if (grants.size === 0) {
    return problem(403, "FORBIDDEN", `You have no access to "${manifest.name}".`);
  }

  const base = options.base ?? `/t/${options.tool}`;
  if (path === "/play/manifest") {
    const actions = Object.fromEntries(
      Object.entries(manifest.actions).filter(([, action]) => grants.has(action.access)),
    );
    // Resources and dependencies are the platform's business, not the form's.
    const { resources: _resources, uses: _uses, ...shown } = manifest;
    return Response.json({ ...shown, actions }, { headers: { "cache-control": "no-store" } });
  }
  return new Response(playgroundHtml({ base, manifestUrl: `${base}/play/manifest` }), {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "content-security-policy": PAGE_CSP,
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      "referrer-policy": "no-referrer",
    },
  });
}
