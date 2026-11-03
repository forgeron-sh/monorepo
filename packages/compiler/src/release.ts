import type { Manifest } from "@forgeron/manifest";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { buildTool } from "./build";
import {
  bumpVersion,
  ChangelogError,
  CHANGE_TYPES,
  detect,
  readChanges,
  readReleased,
  strongest,
  writeReleased,
  type Bump,
  type ChangeType,
  type PendingChange,
} from "./changelog";
import { RANK } from "./rank";

const TITLES: Record<ChangeType, string> = {
  added: "Added",
  changed: "Changed",
  fixed: "Fixed",
  removed: "Removed",
  security: "Security",
};

interface BuiltMigration {
  name: string;
  destructive: boolean;
}

async function builtFiles(outDir: string) {
  const manifest = JSON.parse(await readFile(join(outDir, "manifest.json"), "utf8")) as Manifest;
  const migrations = JSON.parse(
    await readFile(join(outDir, "migrations.json"), "utf8").catch(() => "[]"),
  ) as BuiltMigration[];
  return { manifest, migrations };
}

export interface CheckResult {
  ok: boolean;
  declared: string;
  detected: string;
  problems: string[];
}

/** `forgeron change check`: do the declared changes cover what the manifest says changed? */
export async function checkChanges(toolDir: string): Promise<CheckResult> {
  const dir = resolve(toolDir);
  const { outDir } = await buildTool(dir);
  const { manifest, migrations } = await builtFiles(outDir);
  const [pending, released] = await Promise.all([readChanges(dir), readReleased(dir)]);
  const { impact, diff } = detect(released, manifest, migrations);
  const declared = strongest(pending);
  const problems: string[] = [];
  if (impact !== "none" && pending.length === 0)
    problems.push(
      `The manifest changed (${impact}) since ${released?.version}, but changes/ is empty: run \`forgeron change\`.`,
    );
  else if (RANK[declared] < RANK[impact])
    problems.push(
      `The declared impact (${declared}) is lower than the detected one (${impact}): ${(
        diff?.changes ?? []
      )
        .filter((c) => c.impact === impact)
        .map((c) => c.subject)
        .join(", ")}.`,
    );
  return { ok: problems.length === 0, declared, detected: impact, problems };
}

export interface ReleaseResult {
  name: string;
  version: string;
  /** What `git add` should take, relative to the tool. */
  files: string[];
}

/** `forgeron release`: computes the version, writes CHANGELOG.md, package.json, and empties changes/. */
export async function release(toolDir: string, now: Date = new Date()): Promise<ReleaseResult> {
  const dir = resolve(toolDir);
  const pending = await readChanges(dir);
  if (pending.length === 0)
    throw new ChangelogError("changes/ is empty: there is nothing to release.");

  const check = await checkChanges(dir);
  if (!check.ok) throw new ChangelogError(check.problems.join("\n"));

  const { outDir } = await buildTool(dir);
  const { manifest, migrations } = await builtFiles(outDir);
  const released = await readReleased(dir);
  const bump = strongest(pending) as Bump;
  const version = bumpVersion(manifest.version, bump);

  const { diff } = detect(released, manifest, migrations);
  const known = new Set(released?.migrations ?? []);
  const technical = [
    `- Actions added: ${list((diff?.changes ?? []).filter((c) => c.kind === "action.added").map((c) => c.subject.replace(/^actions\./, "")))}`,
    `- Actions removed: ${list((diff?.changes ?? []).filter((c) => c.kind === "action.removed").map((c) => c.subject.replace(/^actions\./, "")))}`,
    `- Migrations: ${list(migrations.filter((m) => !known.has(m.name)).map((m) => m.name))}`,
    `- Resources: ${list(
      (diff?.changes ?? [])
        .filter((c) => c.kind === "resource.added")
        .map((c) => c.subject.replace(/^resources\./, "")),
      "no new ones",
    )}`,
  ];
  const day = now.toISOString().slice(0, 10);
  const sections = CHANGE_TYPES.flatMap((type) => {
    const entries = pending.filter((c) => c.type === type);
    return entries.length
      ? [`### ${TITLES[type]}\n\n${entries.map((c) => `- ${oneLine(c)}`).join("\n")}\n`]
      : [];
  });
  const entry = `## ${version} — ${day}\n\n${sections.join("\n")}\n### Technical\n\n${technical.join("\n")}\n`;

  const changelogFile = join(dir, "CHANGELOG.md");
  const before = await readFile(changelogFile, "utf8").catch(() => "");
  const body = before.replace(/^# Changelog\s*/, "");
  await writeFile(changelogFile, `# Changelog\n\n${entry}${body ? `\n${body.trimStart()}` : ""}`);

  const packageFile = join(dir, "package.json");
  const pkg = JSON.parse(await readFile(packageFile, "utf8")) as Record<string, unknown>;
  pkg.version = version;
  await writeFile(packageFile, `${JSON.stringify(pkg, null, 2)}\n`);

  await mkdir(join(dir, ".forgeron"), { recursive: true });
  await writeReleased(dir, {
    version,
    manifest: { ...manifest, version },
    migrations: migrations.map((m) => m.name),
    entries: pending.map(({ type, bump: b, description }) => ({ type, bump: b, description })),
  });
  for (const change of pending) await rm(join(dir, change.file));

  return {
    name: manifest.name,
    version,
    files: [
      "CHANGELOG.md",
      "package.json",
      ".forgeron/released.json",
      ...pending.map((c) => c.file),
    ],
  };
}

const list = (names: string[], none = "none") => (names.length ? names.join(", ") : none);
// A multi-line description stays one bullet.
const oneLine = (c: PendingChange) => c.description.replace(/\s*\n\s*/g, " ");
