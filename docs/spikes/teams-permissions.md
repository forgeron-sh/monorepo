# Teams and permissions, no roles (D-137) — implementation spec

This is the brief every implementation step follows. The decision itself is recorded as D-137 in
[`DECISIONS.md`](../DECISIONS.md); this file is the detailed shape.

## Why

Workspace roles (`admin`, `member`, `developer`, typed ones) and teams (D-132, mapped as the role
`team-<id>`) were two ways to say "a group of people", with two screens, two vocabularies and a
`member` role computed for everyone. A person in several groups is the normal case. From now on
**there are no roles**: a person is in **teams**, every person is part of **everyone**, and what a
team may do is a set of **atomic permissions**, decided by **one engine**.

## Vocabulary (use these words everywhere: code, API, UI, docs)

| Word                    | Meaning                                                                                                                                                                                         |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Team**                | A named group of members (`id` slug, `name`, `description`, `members`). A person may be in any number.                                                                                          |
| **Built-in team**       | `admin` and `developer`, created in every workspace, cannot be deleted. `admin` always holds `*` (locked) and cannot be emptied (the last admin stays). `developer`'s permissions are editable. |
| **Everyone**            | Every person of the workspace. Not a team, not stored: a subject.                                                                                                                               |
| **Subject**             | Who a grant names: `everyone` or `team:<id>`. Type `Subject` in `@forgeron/permissions`.                                                                                                        |
| **Platform permission** | An atomic right on Forgeron itself (`tools:publish`, `members:write`, …). Catalog `PLATFORM` in `@forgeron/permissions`. A write implies its read. `*` = all, now and to come.                  |
| **Tool permission**     | A level a tool's actions and views require (`read`, `write`), declared by the tool (unchanged).                                                                                                 |
| **Profile**             | A named set of tool permissions a tool suggests (`user`, `manager`), one default (unchanged, D-127).                                                                                            |
| **Grant** (tool)        | What a subject is given in a tool: `all`, a profile, custom permissions, or none (was "mapping of roles").                                                                                      |
| **Exception**           | A per-action / per-view override of the matrix for a subject (unchanged, keyed by subject).                                                                                                     |

The words "role", "roles", `ADMIN_ROLE`, `MEMBER_ROLE`, `workspaceRoles`, `teamRole`, `team-<id>`,
`minRole`, `defaultRole`, `groupRoles` disappear from the code, the API, the UI and the docs. Only
two places may still read the old shapes, each in one named function with a comment `legacy (D-137)`:
the manifest parser (stored builds) and the header the gateway sends to a tool's Worker (runtimes
already deployed). ARIA `role="…"` attributes are unrelated and stay.

## The engine: `@forgeron/permissions` (new package, written, leaf)

`packages/permissions/src/{subjects,engine,platform}.ts`. Read it before anything else. Exports:
`EVERYONE`, `Subject`, `TEAM_ID`, `ADMIN_TEAM`, `DEVELOPER_TEAM`, `isTeamId`, `teamSubject`, `teamOf`,
`isSubject`, `subjectsOf(teams)`; `ALL`, `defineCatalog`, `expand`, `holds`, `permissionsOfSubjects`,
`missingToGrant` (anti-escalation), `minimal`, `permissionNames`, `isPermission`; `PLATFORM`,
`PlatformPermission`, `PLATFORM_PERMISSIONS`, `PLATFORM_GROUPS`, `BUILT_IN_TEAMS`, `isBuiltInTeam`,
`platformPermissions(teams, grantsByTeam)`, `storedPlatformGrants`.

It is published with the other packages (`scripts/packages.ts`, before `manifest`; `packages:build`;
`release-please-config.json` if it lists packages), because `@forgeron/manifest` depends on it.
`.dependency-cruiser.cjs`: a `permissions-is-a-leaf` rule; `manifest-is-a-leaf` allows
`packages/permissions/`; `platform-contract-imports-schemas-only` allows it too.

### Platform permissions → what they open (gateway `platformRoute(route, permission)`)

| Permission                 | Opens                                                                                                                     |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| (signed in)                | library, catalog, My secrets, own profile, `GET /api/teams`, whoami                                                       |
| `tools:read`               | Administration › Tools, a tool's pages (overview, channels, releases, logs, schema, CI)                                   |
| `tools:write`              | create a tool, add from GitHub/template, link a repository, sources/channels add/put/remove, update tool settings, deploy |
| `tools:publish`            | publish/promote a channel, rollback                                                                                       |
| `tools:approve`            | approvals list/decide, revoke a person's user secrets / tokens for a tool, user setup listing                             |
| `tools:data`               | database explorer queries, migrations listing, copy branch data                                                           |
| `tools:secrets`            | a tool's secrets (list/set/reseal)                                                                                        |
| `tools:delete`             | delete a tool for good                                                                                                    |
| `access:read/write`        | `GET` / `PUT /api/tools/{tool}/access-matrix`, admin MCP `access_*`                                                       |
| `members:read/write`       | members list / invite, remove, withdraw, membership settings, connections                                                 |
| `teams:write`              | `POST/PATCH/DELETE /api/teams…`, a team's permissions — always also checked with `missingToGrant` (below)                 |
| `marketplace:read/write`   | list marketplaces & their tools / add, sync, remove, install, plan                                                        |
| `settings:read/write`      | workspace settings, identity provider, domains, GitHub app, connector clients, sealing key                                |
| `audit:read`, `usage:read` | audit log, usage                                                                                                          |

Where today's guard is `"developer"` the new one is the matching `tools:*` permission; where it is
`"admin"`, the most specific permission of the table. The implementer of the gateway lists every
`platformRoute` and every hand-written check (`roles.includes("admin")` in deploy/rollback, admin MCP
`minRole`) and maps each one; the mapping is part of the PR description.

### Anti-escalation (teams)

Changing a team's **permissions** or **members** requires `teams:write` **and**
`missingToGrant(PLATFORM, actorPermissions, team's permissions before ∪ after) == []`. So only a
holder of `*` changes the admin team; a developer-only manager cannot add themselves to `admin`.
Refused with 403 `FORBIDDEN` and a message naming the missing permissions. The admin team cannot be
left with no member (409, as the last-admin rule today). Built-in teams cannot be deleted (409).
Admin team's permissions cannot be changed (409, `locked`).

## Tools: access by subject (`@forgeron/manifest`, runtime, SDK)

- `access.ts`: every `role` becomes `subject`. `AccessMapping = Record<Subject, ProfileGrant>` (rename
  the type `AccessGrants`), `AccessOverrides = Record<Subject, Record<string, boolean>>`,
  `RolePermissions` → `SubjectPermissions`. `defaultMapping` → `defaultGrants(profiles)`:
  `team:admin` → `all`, `everyone` → default profile. `Who = { subjects; access?; permissions? }`.
  `mayAccess`, `heldPermissions`, `resolveAccess(subjects, grants, overrides, manifest)` keep their
  logic. Remove `ADMIN_ROLE`, `MEMBER_ROLE`, `workspaceRoles`. Locally (no gateway) a subject is read
  with the default grants; `localPermissions` keeps "a profile of that name" only for the CLI's
  `--as <profile>` path, which now passes the profile's permissions directly (see CLI).
- `schema.ts`: the manifest key for profiles becomes **`profiles`** (`ProfileSchema`, type `Profile`;
  remove `RoleSchema`/`Role`). `parseManifest`/`ManifestSchema` reads a stored build with `roles` by
  renaming it to `profiles` before validation (`legacy (D-137)`). `resources.directory.roles` is
  removed (a stored `roles: true` is dropped by the same legacy step). Directory members lose `roles`.
- `catalog.ts`, `diff.ts` (profile changes are `profile.*` entries), `fixtures.ts`, tests: follow.
- Runtime `types.ts` `RequestUser`: `subjects: string[]`, `access`, `permissions` (by subject); no
  `roles`. Reading the request: accept `roles` from an old gateway as `subjects` (`legacy (D-137)`).
  `engine.ts`: `mayAccess(user, manifest.profiles, …)`. `directory.ts`: no roles.
- SDK: `ctx.user.roles` removed; `ctx.user.can(permission)` stays; `ctx.user.teams` stays (only with
  `directory.teams`). `config.ts`: `profiles` only; `roles` refused with a clear error ("`roles` is now
  `profiles` (D-137)"). `directory()` loses `roles`. Testing: `createTestTool({ as })` identity takes
  `{ id?, email?, name?, teams?, profile?, permissions? }` — `profile` gives that profile's grants,
  `permissions` gives exactly those, neither gives the default grants for `everyone` + `teams`
  (with `team:admin` → all). `roles` in `as` is a type error.
- CLI `forgeron dev`: `--as <profile>` (a profile of the tool, or `all`), `--team <id>` repeatable,
  `--user <email>` unchanged. `dev-directory.json`: teams, no roles. Help text and errors updated.
- compiler, hosting (`local*.ts`), playground, scaffold (`tool.ts` writes `profiles`), templates:
  follow; no "role" left.

## The wire to a tool's Worker (gateway → runtime)

The gateway forwards `subjects` (`subjectsOf(person.teams)`), `permissions` by subject and `access`
resolved by subject. For runtimes built before D-137 it also sends the same subjects under `roles`
and `access` keyed by them (old `mayAccess` then gives the same answer). One function builds it, with
the `legacy (D-137)` comment.

## Registry (D1) — migration `00NN_teams_permissions` (next number), one-way

1. `teams` gains `built_in INTEGER NOT NULL DEFAULT 0`. New table `team_permissions(workspace,
   team_id, permission, PRIMARY KEY(workspace, team_id, permission))`.
2. Per workspace that has members: create teams `admin` and `developer` from `BUILT_IN_TEAMS` if
   missing, mark them `built_in`, give `admin` `*` and `developer` its defaults (if a team of that id
   already existed, it becomes the built-in, its members kept).
3. Members: role `admin` → member of team `admin`; `developer` → `developer`; `member` → nothing;
   any other role `R` → team `slug(R)` (lower case, `_`→`-`, cut to 34; created with name `R`, no
   permissions) holding those members. Same for invitations (`roles` → `teams`), the membership
   settings (`default_role` → `default_teams` JSON) and the identity provider's group mapping
   (`groupRoles` → `groupTeams`) wherever it is stored.
4. Tool access: rename `role_profiles` → `access_grants` and `role_access` → `access_exceptions`,
   column `role` → `subject`; rewrite values `admin`→`team:admin`, `member`→`everyone`,
   `team-<id>`→`team:<id>`, `developer`→`team:developer`, other `R`→`team:slug(R)`.
   Availability rules (D-117) that name roles: same rewrite, `member` → `everyone`.
5. Drop `members.roles` (and `invitations.roles`) once copied.
6. `migrations.golden.json` updated; a migration test with an install holding `admin`, `member`,
   `developer`, `support`, `team-product` proves every row lands.

Stores: `members` (`teams` on a member is read from `team_members`; no `setRoles`; `invite(email,
teams)`; join by domain gives `default_teams`; first sign-in admin → team `admin`), `teams`
(`builtIn`, `permissions`, `setTeamPermissions`, protections above, audited `team.permissions`),
`access` (subject everywhere, audit `grant:<subject>`), a new `platformPermissionsOf(workspace,
memberId)` that reads the person's teams and their grants and calls `platformPermissions`.
`accessFor` returns subjects. A deleted team deletes its grants and exceptions (already the rule).
A member removed leaves their teams (already).

## Platform contract

- `members.ts`: `MemberSchema` `{ id, email, name, teams: string[] }`; invitations `teams`;
  `setMemberRolesRoute` → `setMemberTeamsRoute` (`PATCH /api/members/{id}` body `{ teams }`) —
  checked as a change of each team added/removed (anti-escalation); settings `defaultTeams`.
- `teams.ts`: `TeamSchema` `{ id, name, description, members, builtIn, locked, permissions:
  string[] (stored, may be ["*"]), effective: PlatformPermission[] }`; drop `role`; `PATCH` accepts
  `permissions`. New `GET /api/permissions` (signed in): the catalog (`PLATFORM_GROUPS` with
  labels/descriptions/implies) so the console renders it from one source.
- `access-matrix.ts`: `roles` → `subjects` (`everyone` first, then teams by name), with
  `subjectLabels: Record<subject, string>` (team names: fixes D-132's "shows `team-<id>`"); `mapping`
  → `grants`; `changes[].role` → `subject`; `profiles[].role` → `subject`.
- `workspace.ts` (whoami/identity for the console): `person { id, email, name, teams, permissions }`
  — no `admin`/`developer` booleans; the console decides with `permissions.includes(…)`.
- `bearer.ts`, `library.ts`, `marketplaces.ts`: drop role fields; follow.

## Gateway

- `identity/authn/caller.ts`: `Person { id, email, name, teams, subjects, permissions }` (platform
  permissions resolved once per request through the registry). Sign-in: the install's admin email
  joins team `admin`; IdP `groupTeams`; invitation teams; domain default teams.
- `platform/app.ts`: `platformRoute(route, permission: PlatformPermission | "signed-in", message?)`,
  guard with `holds`. 403 message: "This needs the permission <label>." Remove `Access`.
- Every route mapped (table above); deploy/rollback checks → `tools:write` / `tools:publish`.
- Admin MCP: `ToolDefinition.requires: PlatformPermission | "signed-in"` instead of `minRole`; a tool
  is listed only to people who hold it. `access_grant`/`access_revoke` take `subject`
  (`everyone` | `team:<id>`); member tools take `teams`; new `team_*` tools are welcome but optional.
- `dispatch/user-secrets.ts` & views/playground: forward subjects (wire section).
- Delete a tool (`DELETE /api/tools/{tool}`, `tools:delete`): if not existing, add it (registry rows,
  hosting resources, audit `tool.deleted`); console action in the tool page.

## Console UX

Principle: one place for people (Members), one for groups and what they may do (Teams), one per
tool for who uses it (Access tab). No "Roles" anywhere.

- **Members**: a row per person with their **teams as chips**; "Change teams" opens a multi-select of
  teams (built-ins first). Invite: email + teams (none by default). Sign-in by domain: "join with
  teams". The admin badge is the `Admins` chip.
- **Roles and access page is removed**; `/admin/roles` and `/settings/roles` redirect to `/admin/teams`;
  shortcut `r` goes; `g` `e` (or the existing teams shortcut) opens Teams.
- **Teams** (Administration): list with name, members count, a one-line summary of what it may do
  ("Administers everything" for admin, "Builds and publishes tools" style summary, or "Uses tools
  only" when it has no platform permission), built-in badge. A team's page: Members (add/remove),
  **Permissions on Forgeron**: one card per `PLATFORM_GROUPS` group, a checkbox per permission with
  its description; checking a write checks (and disables) its implied reads; permissions the viewer
  does not hold are disabled with a tooltip "You can only give what you hold"; the admin team shows
  "Every permission, now and to come" and no checkboxes. **Tools this team uses**: the tools whose
  grants name this team, with the profile (read-only, links to each tool's Access tab).
- **Access tab of a tool**: rows are **Everyone** then each team **by name**; select per row (No
  access / a profile / Custom / All); exceptions by action keyed by the same rows.
- Navigation and guards read `person.permissions`: Administration shows the pages the person may open
  (Tools with `tools:read`, Marketplace with `marketplace:read`, Members with `members:read`, Teams
  for everyone signed in as read-only, editable with `teams:write`); Settings › Workspace with
  `settings:read`; Operations with `audit:read` / `usage:read`. Write controls are hidden or disabled
  without the matching write permission.
- Mocks (`mock/install.ts`) and tests follow.

## Docs

D-137 in `DECISIONS.md` (Replaces D-127's roles, D-128 §5, D-132 §2; status lines of those updated
"Replaced in part by D-137"). `sdk.md` (Access, `ctx.user`, testing, CLI), `console-ux.md`,
`self-host.md`, `lifecycle.md`, `ARCHITECTURE.md` (new package), READMEs, the CHANGELOG is left to
release-please.

## Other repositories (after the monorepo)

`edicia-sh/odoo` and `edicia-sh/echo` (`roles:` → `profiles:`, README/docs wording "rôle" →
"profil"/"équipe", test fixtures), `edicia-sh/notes` and `edicia-sh/odoo` test fixtures (`roles` in
`as:`), `edicia-sh/crm` comments/docs. Each in its own PR. Their pinned SDK (0.3.1) already accepts
`profiles`; fixtures without `roles` keep working on 0.3.1 (an identity with no role is "member").

## Cases found by the inventory (part of the same change)

- **Availability and pilot channels** (`registry/modules/library/*`, `gateway/library/library.ts`,
  `platform/library.ts`, console `features/tools/publish.tsx`, contract `library.ts`): mode `roles`
  becomes `teams` (a list of team ids; the column keeps JSON, rewritten by the migration: `member` in a
  list → mode `everyone`). "admin always sees a tool" becomes "a holder of `access:write`".
  `reachesChannelAlways`: `tools:read` reaches branch channels, `tools:publish` reaches every channel
  (was developer / admin). `canPreview`, `dispatch.ts`, `mcp-oauth.ts` follow.
- **Catalog card / library sheet** (`registry/catalog.ts`, portal `tool-card.tsx`, `library-page.tsx`,
  `home.tsx`, `tool-lists.tsx`): "Roles that may use it" → "Teams that may use it" (names, and
  "Everyone" when `everyone` has a grant); "Your roles do not let you use this tool" → "None of your
  teams uses this tool yet"; a person holding `access:write` is sent to the Access tab.
- **Profile page** (`settings/pages/profile.tsx`): shows the person's teams (read-only).
- **Sign-in** (`identity-config.ts`, `root-migrations` columns `group_roles` of `identity_providers`
  and `saml_providers` → `group_teams`, `presets.ts` validation, `email-auth.ts`, `caller.ts`): team ids.
  `ADMIN_EMAIL` joins team `admin`. Invitation mail and page: "You join the teams …" (none: nothing).
- **Database explorer** (`console-api/database/index.ts`): explorer needs `tools:data`; hidden columns
  need `tools:data` too.
- **Deploy tokens / close preview / rollback / GitHub connect** (`deploy/*.ts`, `platform/github.ts`):
  `tools:write`, `tools:write`, `tools:publish`, `settings:write`.
- **CLI**: `dev`/`play` `--as <profile>|all` and `--team`; `db` remote writes need the token's person
  to hold `tools:data` (flag `--write` instead of `--as admin`); `admin members invite --team <id>`
  (repeatable), `admin members teams <id> --set a,b`; `admin teams list|create|permissions`.
  Texts: "an admin token" → "a token of someone who holds <permission>".
- **UI architecture diagram** (`packages/ui/src/architecture/*`): node kind `role` → `profile`.
- **Templates**: `inventory`'s profile `admin` is renamed `manager` (a profile named like the admin
  team reads as one); READMEs speak of profiles and teams.
- **Tool access level `admin`** (`BUILT_IN_ACCESS_LEVELS`) is a tool permission name, not a role: it
  stays.
- **Site** (`apps/site`): marketing text speaking of roles → teams/profiles.
- **Console gating** (`shell/access.ts`): route access becomes `"signed-in" | PlatformPermission`;
  `AdminOnly` → `Requires permission=…`; texts "give you the admin role" → "ask someone who can manage
  teams to give you <permission label>".
