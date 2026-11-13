import { ALL, defineCatalog, expand, minimal, permissionNames } from "./engine";
import { ADMIN_TEAM, DEVELOPER_TEAM } from "./subjects";

// What a person may do on the platform itself (D-136): administer the workspace, its people and its
// tools. Each permission is atomic; a write implies its read. A team is given some of them; a person
// holds the union of their teams'. Using a tool is not here: a tool's own permissions and profiles
// are given to subjects in the tool's Access tab (`@forgeron/manifest`).

export const PLATFORM = defineCatalog({
  "tools:read": {
    label: "See tools",
    description:
      "Open Administration, Tools: every tool, its channels, releases, logs and database schema.",
  },
  "tools:write": {
    label: "Build tools",
    description:
      "Create a tool, link a repository, deploy drafts, change channels and a tool's settings.",
    implies: ["tools:read"],
  },
  "tools:publish": {
    label: "Publish tools",
    description: "Publish a channel's version to the people who use it, or roll it back.",
    implies: ["tools:read"],
  },
  "tools:approve": {
    label: "Approve what tools ask for",
    description:
      "Approve the secrets, connectors, network and directory a tool asks for, and revoke them.",
    implies: ["tools:read"],
  },
  "tools:data": {
    label: "Query tool data",
    description: "Run queries on a tool's database and copy data between its channels.",
    implies: ["tools:read"],
  },
  "tools:secrets": {
    label: "Set tool secrets",
    description: "Set and reseal the secrets a tool runs with.",
    implies: ["tools:read"],
  },
  "tools:delete": {
    label: "Delete tools",
    description: "Delete a tool for good: its channels, data and access.",
    implies: ["tools:read"],
  },
  "access:read": {
    label: "See access",
    description: "See who may use each tool, and with which profile.",
    implies: ["tools:read"],
  },
  "access:write": {
    label: "Give access",
    description: "Change which teams may use a tool, with which profile, and its exceptions.",
    implies: ["access:read"],
  },
  "members:read": {
    label: "See members",
    description: "See the members, the pending invitations and who joins by domain.",
  },
  "members:write": {
    label: "Manage members",
    description:
      "Invite and remove members, set who joins by domain, revoke a person's connections.",
    implies: ["members:read"],
  },
  "teams:write": {
    label: "Manage teams",
    description:
      "Create, rename and delete teams, and change who is in them and what they may do, within what you may do yourself.",
    implies: ["members:read"],
  },
  "marketplace:read": {
    label: "See marketplaces",
    description: "Browse the workspace's marketplaces and their tools.",
  },
  "marketplace:write": {
    label: "Manage marketplaces",
    description: "Add, sync and remove marketplaces, and install their tools.",
    implies: ["marketplace:read", "tools:write"],
  },
  "settings:read": {
    label: "See settings",
    description: "See the workspace's settings: general, sign-in, domains, GitHub.",
  },
  "settings:write": {
    label: "Change settings",
    description:
      "Change the workspace's settings: sign-in and its provider, domains, GitHub, connector clients.",
    implies: ["settings:read"],
  },
  "audit:read": {
    label: "Read the audit log",
    description: "Read every change made on the workspace, and by whom.",
  },
  "usage:read": {
    label: "See usage",
    description: "See the workspace's usage and seats.",
  },
});

export type PlatformPermission = keyof typeof PLATFORM.permissions;

/** Every platform permission, in the order the console shows them. */
export const PLATFORM_PERMISSIONS: readonly PlatformPermission[] = permissionNames(PLATFORM);

/** The groups the console shows the permissions in. */
export const PLATFORM_GROUPS: readonly { label: string; permissions: PlatformPermission[] }[] = [
  {
    label: "Tools",
    permissions: [
      "tools:read",
      "tools:write",
      "tools:publish",
      "tools:approve",
      "tools:data",
      "tools:secrets",
      "tools:delete",
    ],
  },
  { label: "Access to tools", permissions: ["access:read", "access:write"] },
  { label: "Members and teams", permissions: ["members:read", "members:write", "teams:write"] },
  { label: "Marketplaces", permissions: ["marketplace:read", "marketplace:write"] },
  { label: "Workspace", permissions: ["settings:read", "settings:write"] },
  { label: "Operations", permissions: ["audit:read", "usage:read"] },
];

/** What a team built into every workspace is given when it is created. */
export interface BuiltInTeam {
  id: string;
  name: string;
  description: string;
  permissions: readonly string[];
  /** The admin team's permissions cannot be changed: it always holds every one, `*`. */
  locked: boolean;
}

export const BUILT_IN_TEAMS: readonly BuiltInTeam[] = [
  {
    id: ADMIN_TEAM,
    name: "Admins",
    description: "Administer the workspace: every permission, now and to come.",
    permissions: [ALL],
    locked: true,
  },
  {
    id: DEVELOPER_TEAM,
    name: "Developers",
    description: "Build, deploy and publish the workspace's tools.",
    permissions: ["tools:write", "tools:publish", "tools:data", "access:read", "marketplace:read"],
    locked: false,
  },
];

export const isBuiltInTeam = (id: string): boolean => BUILT_IN_TEAMS.some((t) => t.id === id);

/** A person's platform permissions, from what each of their teams is given: `team id -> grants`. */
export function platformPermissions(
  teams: readonly string[],
  grants: Readonly<Record<string, readonly string[]>>,
): PlatformPermission[] {
  const held = expand(
    PLATFORM,
    teams.flatMap((t) => grants[t] ?? []),
  );
  return PLATFORM_PERMISSIONS.filter((p) => held.has(p));
}

/** What to store for a team: the fewest grants that give the same, `*` for every one. */
export const storedPlatformGrants = (granted: Iterable<string>): string[] =>
  minimal(PLATFORM, granted);
