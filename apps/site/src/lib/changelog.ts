import { type CollectionEntry, getCollection } from "astro:content";

export type Change = CollectionEntry<"changelog">;

/** The changes, newest first (by date, then by version); drafts in `astro dev` only. */
export async function getChanges(): Promise<Change[]> {
  const changes = await getCollection("changelog", (c) => import.meta.env.DEV || !c.data.draft);
  return changes.sort(
    (a, b) =>
      b.data.date.getTime() - a.data.date.getTime() ||
      (b.data.version ?? "").localeCompare(a.data.version ?? "", "en", { numeric: true }),
  );
}

const month = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "long", timeZone: "UTC" });

/** The changes by month, newest month first: `November 2026`. */
export function byMonth(changes: readonly Change[]): { month: string; changes: Change[] }[] {
  const groups: { month: string; changes: Change[] }[] = [];
  for (const change of changes) {
    const name = month.format(change.data.date);
    const last = groups.at(-1);
    if (last?.month === name) last.changes.push(change);
    else groups.push({ month: name, changes: [change] });
  }
  return groups;
}

/** `breaking`, for the type's class and the filter. */
export function slug(value: string): string {
  return value.toLowerCase().replace(/\s+/g, "-");
}

/** The entry as plain Markdown, for agents and for `/changelog/<id>.md`. */
export function asMarkdown(change: Change, site: URL | undefined): string {
  const { data } = change;
  const url = new URL(`/changelog/${change.id}`, site ?? "https://forgeron.sh");
  const meta = [
    `Date: ${data.date.toISOString().slice(0, 10)}`,
    data.version ? `Version: ${data.version}` : null,
    `Type: ${data.type}`,
    `Areas: ${data.areas.join(", ")}`,
    `URL: ${url.href}`,
  ].filter(Boolean);
  return `# ${data.title}\n\n${meta.join("\n")}\n\n${data.summary}\n\n${(change.body ?? "").trim()}\n`;
}
