// sdk.md §7: `[a-z0-9-]`, 3 to 40 characters; these are reserved.
const WORKSPACE = /^[a-z0-9-]{3,40}$/;
const RESERVED = new Set([
  "www",
  "app",
  "api",
  "docs",
  "status",
  "console",
  "mcp",
  "admin",
  "auth",
  "cdn",
  "static",
  "play",
]);

/** The workspace named by a host: exactly one label under the base domain. */
export function workspaceOf(host: string, baseDomain: string): string | undefined {
  const name = host.toLowerCase().replace(/:\d+$/, "").replace(/\.$/, "");
  const suffix = `.${baseDomain.toLowerCase()}`;
  if (!name.endsWith(suffix)) return undefined;
  const label = name.slice(0, -suffix.length);
  return WORKSPACE.test(label) && !RESERVED.has(label) ? label : undefined;
}

/** A host as the gateway compares it: lower case, no port, no trailing dot. */
export const hostKey = (host: string): string =>
  host.trim().toLowerCase().replace(/:\d+$/, "").replace(/\.$/, "");

const HOST = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/;

/**
 * `WORKSPACE_HOSTS` (D-126): `host=workspace,host=workspace`. An entry that is not a host and a
 * workspace name is left out, and logged: a typo must not stop the gateway.
 */
export function parseWorkspaceHosts(value: string | undefined): Array<[string, string]> {
  const entries: Array<[string, string]> = [];
  for (const raw of (value ?? "").split(",")) {
    const entry = raw.trim();
    if (!entry) continue;
    const [host, workspace, ...extra] = entry.split("=").map((p) => p.trim());
    const key = hostKey(host ?? "");
    const name = (workspace ?? "").toLowerCase();
    if (extra.length > 0 || !HOST.test(key) || !WORKSPACE.test(name) || RESERVED.has(name)) {
      console.error("WORKSPACE_HOSTS: an entry is not host=workspace; it is ignored.");
      continue;
    }
    if (!entries.some(([h]) => h === key)) entries.push([key, name]);
  }
  return entries;
}

/** What the gateway is told about the hosts it serves (D-126). */
export interface HostSettings {
  /** `forgeron.app`: `<workspace>.<BASE_DOMAIN>` serves that workspace. Optional in self-host. */
  BASE_DOMAIN?: string;
  /** `host=workspace,…`: exact hosts and the workspace each serves. */
  WORKSPACE_HOSTS?: string;
  /** The workspace any other host serves (single-workspace mode). */
  DEFAULT_WORKSPACE?: string;
}

/**
 * Which workspace a host serves, and the one address of each workspace (D-126).
 *
 * A host serves a workspace when it is mapped (`WORKSPACE_HOSTS`), else when it is
 * `<workspace>.<BASE_DOMAIN>`, else the default workspace when one is set. The primary origin of a
 * workspace is its first mapped host, else `https://<workspace>.<BASE_DOMAIN>`. It is the address
 * that must stay stable: the audience of CI tokens, the GitHub App's addresses, the links in mails,
 * the redirect URIs of single sign-on and the addresses the console shows.
 */
export interface WorkspaceHosts {
  workspaceOf(host: string): string | undefined;
  /** The primary origin; `undefined` when the workspace has neither a mapped host nor a base domain. */
  primaryOrigin(workspace: string): string | undefined;
}

export function workspaceHosts(settings: HostSettings): WorkspaceHosts {
  const mapped = parseWorkspaceHosts(settings.WORKSPACE_HOSTS);
  const byHost = new Map(mapped);
  const base = settings.BASE_DOMAIN?.trim() || undefined;
  const fallback = settings.DEFAULT_WORKSPACE?.trim().toLowerCase() || undefined;
  const defaultWorkspace =
    fallback && WORKSPACE.test(fallback) && !RESERVED.has(fallback) ? fallback : undefined;
  if (fallback && !defaultWorkspace) {
    console.error("DEFAULT_WORKSPACE is not a workspace name; it is ignored.");
  }
  return {
    workspaceOf(host) {
      const key = hostKey(host);
      const exact = byHost.get(key);
      if (exact) return exact;
      const named = base ? workspaceOf(key, base) : undefined;
      return named ?? defaultWorkspace;
    },
    primaryOrigin(workspace) {
      const first = mapped.find(([, w]) => w === workspace);
      if (first) return `https://${first[0]}`;
      return base ? `https://${workspace}.${base}` : undefined;
    },
  };
}
