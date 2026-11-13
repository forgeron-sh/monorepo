import type { Manifest } from "@forgeron/manifest";
import type { Directory, DirectoryMember, DirectorySnapshot, DirectoryTeam, User } from "./types";

// `ctx.directory` (D-131, D-132). The gateway hands a call the part of the workspace's directory the
// tool declared (`resources.directory`); this filters it once more by that declaration, so a snapshot
// that carries too much still leaks nothing: pictures only with `avatars`,
// the other people only with `members`, teams only with `teams`.

const refused = (what: string) =>
  Object.assign(new Error(`ctx.directory.${what} needs it in resources.directory.`), {
    name: "ToolError",
    code: "FORBIDDEN",
  });

const MAX = 500;

export function createDirectory(
  declaration: NonNullable<Manifest["resources"]["directory"]> | undefined,
  snapshot: DirectorySnapshot | undefined,
  user: User,
): Directory {
  const may: Partial<NonNullable<typeof declaration>> = declaration ?? {};
  const shape = (m: DirectoryMember): DirectoryMember => ({
    id: m.id,
    email: m.email,
    name: m.name,
    ...(may.avatars && m.avatar ? { avatar: m.avatar } : {}),
    ...(may.teams && m.teams ? { teams: m.teams } : {}),
  });
  const everyone = (snapshot?.members ?? []).map(shape);
  const teams: DirectoryTeam[] = may.teams ? (snapshot?.teams ?? []) : [];
  const mine = new Set(user.teams ?? []);
  const me: DirectoryMember = {
    id: user.id,
    email: user.email,
    name: user.name,
    ...(may.avatars && user.avatar ? { avatar: user.avatar } : {}),
    ...(may.teams ? { teams: [...mine] } : {}),
  };
  return {
    me: () => me,
    async member(idOrEmail) {
      if (!may.members) {
        if (idOrEmail === me.id || idOrEmail.toLowerCase() === me.email.toLowerCase()) return me;
        throw refused("member (others)");
      }
      const wanted = idOrEmail.toLowerCase();
      return everyone.find((m) => m.id === idOrEmail || m.email.toLowerCase() === wanted);
    },
    async members(options = {}) {
      if (!may.members) throw refused("members");
      const query = options.query?.trim().toLowerCase();
      const team = options.team ? teams.find((t) => t.id === options.team) : undefined;
      if (options.team && !may.teams) throw refused("members({ team })");
      return everyone
        .filter((m) => !query || `${m.name} ${m.email}`.toLowerCase().includes(query))
        .filter((m) => !options.team || team?.members.includes(m.id))
        .slice(0, Math.min(options.limit ?? MAX, MAX));
    },
    async team(id) {
      if (!may.teams) throw refused("team");
      // A team the caller is not in is not hidden by the platform (access is the tool's rule, D-132),
      // but only its id, name and members are given.
      return teams.find((t) => t.id === id);
    },
    async teams(options = {}) {
      if (!may.teams) throw refused("teams");
      return options.mine ? teams.filter((t) => mine.has(t.id)) : teams;
    },
    inTeam: (id) => mine.has(id),
  };
}
