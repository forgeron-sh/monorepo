import type { Manifest } from "@forgeron/manifest";
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
  roles?: string[];
}

export interface DevDirectoryFile {
  members: DevPerson[];
  /** `members` are emails. */
  teams?: Array<{ id: string; name: string; description?: string; members: string[] }>;
}

const SAMPLE: DevDirectoryFile = {
  members: [
    { email: "dev@localhost", name: "Local developer", roles: ["admin"] },
    { email: "sam@acme.fr", name: "Sam Martin", roles: ["member"] },
    { email: "mia@acme.fr", name: "Mia Dupont", roles: ["member", "manager"] },
  ],
  teams: [
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
      roles: m.roles ?? ["member"],
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

/** The developer as `--user` names them, with the roles of the directory (or `--as`). */
export function developer(
  file: DevDirectoryFile,
  manifest: Manifest,
  user: string | undefined,
  role: string | undefined,
) {
  const email = user ?? "dev@localhost";
  const person = file.members.find((m) => m.email === email);
  if (user && !person) {
    throw new UsageError(
      `--user ${user}: not in the directory (${file.members.map((m) => m.email).join(", ")}). Add them to .forgeron/local/directory.json.`,
    );
  }
  const teams = snapshotOf(file).members.find((m) => m.email === email)?.teams ?? [];
  return {
    id: idOf(email),
    email,
    name: person?.name ?? (role ? `Local developer (${role})` : "Local developer"),
    ...(person?.avatar ? { avatar: person.avatar } : {}),
    // Without `--user` the developer holds every role of the tool, as before the directory existed.
    roles: role ? [role] : user ? (person?.roles ?? []) : Object.keys(manifest.roles),
    ...(manifest.resources.directory?.teams ? { teams } : {}),
  };
}
