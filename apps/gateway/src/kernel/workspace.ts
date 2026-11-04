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
