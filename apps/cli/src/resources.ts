import type { Manifest } from "@forgeron/manifest";

/** What the admin sees before installing (docs/sdk.md §3): one block per requested resource. */
export function describeResources(manifest: Manifest): string[] {
  const { resources, jobs, views } = manifest;
  const lines = [`${manifest.title ?? manifest.name} v${manifest.version} requests:`];
  const row = (label: string, why?: string) => lines.push(`  ${label.padEnd(30)}${why ?? ""}`);

  if (resources.db) row("Database (D1)", resources.db.why);
  if (resources.files) {
    row(`File storage (${resources.files.maxSize})`, resources.files.why);
  }
  if (resources.cache) row("Cache", resources.cache.why);
  if (resources.directory) {
    const d = resources.directory;
    const what = [
      d.members && "the other people of the workspace",
      d.roles && "their roles",
      d.avatars && "their pictures",
      d.teams && "the teams",
    ].filter(Boolean);
    row(`Directory (${what.length ? what.join(", ") : "you only"})`, d.why);
  }
  if (resources.queue) row("Queue", resources.queue.why);
  for (const [name, secret] of Object.entries(resources.secrets ?? {})) {
    row(`Secret ${name}`, secret.why);
  }
  for (const [name, connector] of Object.entries(resources.connectors ?? {})) {
    const who = connector.mode === "delegated" ? "on behalf of each person" : "as the application";
    lines.push(`  ${connector.type} (${name}), ${who}`);
    for (const scope of connector.scopes) row(`    · ${scope}`, connector.why);
  }
  for (const [name, secret] of Object.entries(resources.userSecrets ?? {})) {
    row(`One ${secret.label} per person (${name})`, secret.why);
  }
  if (resources.network) {
    lines.push(
      `  Outbound calls: ${resources.network.allow.join(", ")}  (${resources.network.why})`,
    );
  }
  const jobCount = Object.keys(jobs).length;
  if (jobCount > 0) lines.push(`  ${jobCount} scheduled task${jobCount > 1 ? "s" : ""}`);
  const viewCount = Object.keys(views).length;
  if (viewCount > 0) lines.push(`  ${viewCount} view${viewCount > 1 ? "s" : ""}`);
  if (lines.length === 1) lines.push("  No resource.");
  return lines;
}
