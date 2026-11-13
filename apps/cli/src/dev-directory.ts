import type { LocalUser } from "@forgeron/hosting/local";
import { permissionsOf, type Manifest } from "@forgeron/manifest";
import { ADMIN_TEAM, EVERYONE, subjectsOf } from "@forgeron/permissions";
import type { DirectorySnapshot } from "@forgeron/runtime";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { UsageError } from "./io";

// The workspace's people and teams in `forgeron dev` (D-131, D-132): there is no workspace here, so
// they come from `.forgeron/local/directory.json`, or from a small made-up one. Choosing who the
// developer is (`--user`) is how a test sees a note shared with someone else.

interface DevPerson {
  email: string;
  name?: string;
  avatar?: string;
}

export interface DevDirectoryFile {
  members: DevPerson[];
  /** `members` are emails. */
  teams?: Array<{ id: string; name: string; description?: string; members: string[] }>;
}

const SAMPLE: DevDirectoryFile = {
  members: [
    { email: "dev@localhost", name: "Local developer" },
    { email: "sam@acme.fr", name: "Sam Martin" },
    { email: "mia@acme.fr", name: "Mia Dupont" },
  ],
  teams: [
    { id: "admin", name: "Admins", members: ["dev@localhost"] },
    { id: "product", name: "Product", members: ["dev@localhost", "sam@acme.fr"] },
    { id: "sales", name: "Sales", members: ["mia@acme.fr"] },
  ],
};

const idOf = (email: string) => (email === "dev@localhost" ? "dev" : `user:${email}`);

export function readDevDirectory(dir: string): DevDirectoryFile {
  try {
    const file = JSON.parse(
      readFileSync(join(dir, ".forgeron", "local", "directory.json"), "utf8"),
    ) as DevDirectoryFile;
    if (!Array.isArray(file.members)) {
      throw new UsageError(".forgeron/local/directory.json needs a `members` list.");
    }
    return file;
  } catch (error) {
    if (error instanceof UsageError) throw error;
    return SAMPLE;
  }
}

/** The snapshot the tool is given, with the teams each member belongs to. */
export function snapshotOf(file: DevDirectoryFile): DirectorySnapshot {
  const teamsOf = (email: string) =>
    (file.teams ?? []).filter((t) => t.members.includes(email)).map((t) => t.id);
  return {
    members: file.members.map((m) => ({
      id: idOf(m.email),
      email: m.email,
      name: m.name ?? m.email,
      ...(m.avatar ? { avatar: m.avatar } : {}),
      teams: teamsOf(m.email),
    })),
    teams: (file.teams ?? []).map((t) => ({
      id: t.id,
      name: t.name,
      ...(t.description ? { description: t.description } : {}),
      members: t.members.map(idOf),
    })),
  };
}

/** Who `forgeron dev` runs as: `--user`, `--team`, and `--as`. */
export interface DevWho {
  user?: string | undefined;
  /** A profile of the tool, or `all`: only what it gives, whatever the teams say. */
  as?: string | undefined;
  teams?: readonly string[] | undefined;
}

/**
 * The developer as `--user` names them (D-136). Their teams are `--team`, else those of the directory;
 * without `--user` the developer is also in the admin team, so they may do everything, as before the
 * directory existed. `--as <profile>` gives exactly that profile's permissions, `--as all` every
 * permission of the tool; without `--as` the default grants apply to their subjects.
 */
export function developer(file: DevDirectoryFile, manifest: Manifest, who: DevWho): LocalUser {
  const email = who.user ?? "dev@localhost";
  const person = file.members.find((m) => m.email === email);
  if (who.user && !person) {
    throw new UsageError(
      `--user ${who.user}: not in the directory (${file.members.map((m) => m.email).join(", ")}). Add them to .forgeron/local/directory.json.`,
    );
  }
  const own = snapshotOf(file).members.find((m) => m.email === email)?.teams ?? [];
  const named = who.teams ?? [];
  const teams = named.length
    ? [...named]
    : who.user || who.as !== undefined
      ? own
      : [...new Set([...own, ADMIN_TEAM])];
  let permissions: Record<string, string[]> | undefined;
  if (who.as === "all") permissions = { [EVERYONE]: permissionsOf(manifest) };
  else if (who.as !== undefined) {
    permissions = { [EVERYONE]: [...(manifest.profiles[who.as]?.grants ?? [])] };
  }
  return {
    id: idOf(email),
    email,
    name: person?.name ?? (who.as ? `Local developer (${who.as})` : "Local developer"),
    ...(person?.avatar ? { avatar: person.avatar } : {}),
    subjects: subjectsOf(teams),
    ...(permissions ? { permissions } : {}),
    ...(manifest.resources.directory?.teams ? { teams } : {}),
  };
}
