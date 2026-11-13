import { addresses } from "@forgeron/platform-contract/client";
import {
  ADMIN_TEAM,
  expand,
  PLATFORM,
  PLATFORM_GROUPS,
  type PlatformPermission,
} from "@forgeron/permissions";
import { ok, typedClient, type FetchJson } from "./api";

// The workspace's teams and the catalog of what a team may be given on Forgeron (D-137). A person is
// in any number of teams; what they may do on the platform is the union of their teams'.

export interface TeamRow {
  id: string;
  name: string;
  description: string;
  /** The ids of its members. */
  members: string[];
  /** `admin` and `developer`: they cannot be deleted. */
  builtIn: boolean;
  /** `admin`: it always holds every permission, which cannot be changed. */
  locked: boolean;
  /** As stored: the fewest grants, `["*"]` for every permission. */
  permissions: string[];
  /** Every permission it gives, the implied ones included. */
  effective: PlatformPermission[];
}

export async function loadTeams(fetchJson: FetchJson): Promise<TeamRow[]> {
  return ok(await typedClient(fetchJson)(addresses.listTeams)).teams;
}

interface PermissionEntry {
  name: PlatformPermission;
  label: string;
  description: string;
  implies: PlatformPermission[];
}
export interface PermissionGroup {
  label: string;
  permissions: PermissionEntry[];
}

/** The platform permissions by group, from the platform: one source for every screen that draws them. */
export async function loadPermissionCatalog(fetchJson: FetchJson): Promise<PermissionGroup[]> {
  return ok(await typedClient(fetchJson)(addresses.listPermissions)).groups;
}

/** Built-in teams first (`admin`, then the others), then the rest by name. */
const rank = (t: TeamRow) => (t.id === ADMIN_TEAM ? 0 : t.builtIn ? 1 : 2);
export const byTeam = (a: TeamRow, b: TeamRow): number =>
  rank(a) - rank(b) || a.name.localeCompare(b.name);

/** What a person may do on the platform: the permissions of every team they are in. */
export function permissionsOfMember(teams: readonly TeamRow[], memberTeams: readonly string[]) {
  return expand(
    PLATFORM,
    teams.filter((t) => memberTeams.includes(t.id)).flatMap((t) => t.effective),
  );
}

// One short phrase per group of the catalog, from the strongest permission the team holds in it.
const PHRASES: Record<string, (has: (p: PlatformPermission) => boolean) => string | undefined> = {
  Tools: (has) =>
    [
      has("tools:write") ? "builds tools" : undefined,
      has("tools:publish") ? "publishes them" : undefined,
      has("tools:approve") || has("tools:data") || has("tools:secrets") || has("tools:delete")
        ? "runs them"
        : undefined,
    ]
      .filter(Boolean)
      .join(", ") || (has("tools:read") ? "sees tools" : undefined),
  "Access to tools": (has) =>
    has("access:write") ? "gives access" : has("access:read") ? "sees who has access" : undefined,
  "Members and teams": (has) =>
    has("members:write") || has("teams:write")
      ? "manages people and teams"
      : has("members:read")
        ? "sees members"
        : undefined,
  Marketplaces: (has) =>
    has("marketplace:write")
      ? "manages marketplaces"
      : has("marketplace:read")
        ? "browses marketplaces"
        : undefined,
  Workspace: (has) =>
    has("settings:write") ? "changes settings" : has("settings:read") ? "sees settings" : undefined,
  Operations: (has) =>
    has("audit:read") || has("usage:read") ? "reads audit and usage" : undefined,
};

/** One line on what a team may do on Forgeron; "Uses tools only" when it has no platform permission. */
export function teamSummary(team: Pick<TeamRow, "locked" | "permissions" | "effective">): string {
  if (team.locked || team.permissions.includes("*")) return "Administers everything";
  const held = new Set(team.effective);
  const has = (p: PlatformPermission) => held.has(p);
  const parts = PLATFORM_GROUPS.map((g) => PHRASES[g.label]?.(has)).filter(
    (p): p is string => p !== undefined && p !== "",
  );
  if (parts.length === 0) return "Uses tools only";
  const sentence = parts.join(", ");
  return sentence.charAt(0).toUpperCase() + sentence.slice(1);
}
