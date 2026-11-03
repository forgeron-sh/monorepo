import { diffManifests, maxImpact, type Impact, type Manifest } from "@forgeron/manifest";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

// The changelog of a tool (docs/sdk.md §16): small files in `changes/`, a baseline of what was
// released last (`.forgeron/released.json`, committed), and the comparison of the two with the manifest.

export const CHANGE_TYPES = ["added", "changed", "fixed", "removed", "security"] as const;
export const BUMPS = ["patch", "minor", "major"] as const;
export type ChangeType = (typeof CHANGE_TYPES)[number];
export type Bump = (typeof BUMPS)[number];

export interface ChangeEntry {
  type: ChangeType;
  bump: Bump;
  description: string;
}

export interface PendingChange extends ChangeEntry {
  /** Relative to the tool: `changes/2026-11-03-export-csv.md`. */
  file: string;
}

/** What the last release left: the manifest to compare with, and what the version said. */
export interface Released {
  version: string;
  manifest: Manifest;
  migrations: string[];
  entries: ChangeEntry[];
}

/** `changelog.json`, published with each build. */
export interface Changelog {
  version: string;
  entries: ChangeEntry[];
  /** The strongest impact the entries declare; `none` without an entry. */
  declared: Impact;
  /** The impact found by comparing with the last release; `none` without one or without change. */
  detected: Impact;
  /** A resource is awaiting approval before pilot or production. */
  pendingApproval: boolean;
}

const CHANGES_DIR = "changes";
const RELEASED_FILE = [".forgeron", "released.json"] as const;

export class ChangelogError extends Error {
  override name = "ChangelogError";
}

const isType = (value: string): value is ChangeType =>
  (CHANGE_TYPES as readonly string[]).includes(value);
const isBump = (value: string): value is Bump => (BUMPS as readonly string[]).includes(value);

export function parseChange(file: string, text: string): PendingChange {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(text.trim());
  if (!match) throw new ChangelogError(`${file}: it should start with a --- block (type, bump).`);
  const fields = new Map<string, string>();
  for (const line of match[1]!.split(/\r?\n/)) {
    const [key, ...rest] = line.split(":");
    if (key?.trim()) fields.set(key.trim(), rest.join(":").trim());
  }
  const type = fields.get("type") ?? "";
  const bump = fields.get("bump") ?? "";
  if (!isType(type))
    throw new ChangelogError(`${file}: type "${type}" is not one of ${CHANGE_TYPES.join(", ")}.`);
  if (!isBump(bump))
    throw new ChangelogError(`${file}: bump "${bump}" is not one of ${BUMPS.join(", ")}.`);
  const description = match[2]!.trim();
  if (!description) throw new ChangelogError(`${file}: the description is empty.`);
  return { file, type, bump, description };
}

export async function readChanges(dir: string): Promise<PendingChange[]> {
  let names: string[];
  try {
    names = await readdir(join(dir, CHANGES_DIR));
  } catch {
    return [];
  }
  const changes: PendingChange[] = [];
  for (const name of names.filter((n) => n.endsWith(".md")).sort()) {
    const file = `${CHANGES_DIR}/${name}`;
    changes.push(parseChange(file, await readFile(join(dir, file), "utf8")));
  }
  return changes;
}

/** `forgeron change`: one file per change, so that two branches never step on each other. */
export async function addChange(
  dir: string,
  change: ChangeEntry,
  now: Date = new Date(),
): Promise<string> {
  if (!change.description.trim()) throw new ChangelogError("A change needs a description.");
  const slug =
    change.description
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40)
      .replace(/-$/, "") || "change";
  const day = now.toISOString().slice(0, 10);
  await mkdir(join(dir, CHANGES_DIR), { recursive: true });
  for (let n = 1; ; n++) {
    const file = `${CHANGES_DIR}/${day}-${slug}${n > 1 ? `-${n}` : ""}.md`;
    try {
      await writeFile(
        join(dir, file),
        `---\ntype: ${change.type}\nbump: ${change.bump}\n---\n\n${change.description.trim()}\n`,
        { flag: "wx" },
      );
      return file;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
    }
  }
}

export async function readReleased(dir: string): Promise<Released | undefined> {
  try {
    return JSON.parse(await readFile(join(dir, ...RELEASED_FILE), "utf8")) as Released;
  } catch {
    return undefined;
  }
}

export async function writeReleased(dir: string, released: Released): Promise<void> {
  await mkdir(join(dir, ".forgeron"), { recursive: true });
  await writeFile(join(dir, ...RELEASED_FILE), `${JSON.stringify(released, null, 2)}\n`);
}

export const strongest = (entries: readonly ChangeEntry[]): Impact =>
  entries.reduce<Impact>((impact, entry) => maxImpact(impact, entry.bump), "none");

export function bumpVersion(version: string, bump: Bump): string {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  if (!match) throw new ChangelogError(`The version "${version}" is not a plain x.y.z version.`);
  const [major, minor, patch] = match.slice(1).map(Number) as [number, number, number];
  if (bump === "major") return `${major + 1}.0.0`;
  if (bump === "minor") return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}

/** What the manifest and the migrations changed since the last release (sdk.md §16). */
export function detect(
  released: Released | undefined,
  manifest: Manifest,
  migrations: ReadonlyArray<{ name: string; destructive: boolean }>,
) {
  if (!released) return { impact: "none" as Impact, pendingApproval: false, diff: undefined };
  const diff = diffManifests(released.manifest, manifest);
  const known = new Set(released.migrations);
  const destructive = migrations.some((m) => !known.has(m.name) && m.destructive);
  return {
    impact: destructive ? ("major" as Impact) : diff.impact,
    pendingApproval: diff.pendingApproval,
    diff,
  };
}

/** The changelog of a build: the pending changes, or what the last release said when none is pending. */
export async function changelogOf(
  dir: string,
  manifest: Manifest,
  migrations: ReadonlyArray<{ name: string; destructive: boolean }>,
): Promise<Changelog> {
  const [pending, released] = await Promise.all([readChanges(dir), readReleased(dir)]);
  const { impact, pendingApproval } = detect(released, manifest, migrations);
  const entries: ChangeEntry[] = pending.length
    ? pending.map(({ type, bump, description }) => ({ type, bump, description }))
    : released?.version === manifest.version
      ? released.entries
      : [];
  return {
    version: manifest.version,
    entries,
    declared: strongest(entries),
    detected: impact,
    pendingApproval,
  };
}
