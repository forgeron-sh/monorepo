# D-136 — APIs already landed (wave 1), for the gateway and console

Temporary handoff note next to [`teams-permissions.md`](teams-permissions.md); deleted before merge.
Read the code for exact types; this lists names.

## `@forgeron/permissions`

See `packages/permissions/src`. Note the name clash: `subjectsOf(teams)` here vs `subjectsOf(manifest)`
in `@forgeron/manifest` (action/view → level); import with an alias.

## `@forgeron/manifest` (`access.ts`)

`AccessOverrides`, `SubjectPermissions`, `Profiles`, `ProfileGrant`, `AccessGrants`, `Who { subjects,
access?, permissions? }`, `defaultGrants(profiles)`, `mayAccess(who, profiles, action, level)`,
`heldPermissions(who, manifest)`, `resolveAccess(subjects, grants, overrides, manifest)`. Manifest key
`profiles`. Catalog card field `subjects: { subject, name, label }[]`.

## `@forgeron/runtime`

`User { id, email, name, avatar?, subjects, teams?, access?, permissions? }`;
`readGatewayUser(raw)` is the one legacy reader. The gateway's `x-forgeron-user` JSON is
`{ id, email, name, avatar?, subjects, teams?, access, permissions }` **plus `roles: subjects`** for
runtimes built before D-136 (one function, comment `legacy (D-136)`).

## Registry (`createRegistry(d1)`)

Errors: `FORBIDDEN` (403, message names what is lacking), `PROTECTED` (409), `LAST_ADMIN` (409).
`actorPermissions` = the caller's platform permissions, passed wherever someone could escalate.

- Teams: `ensureBuiltInTeams(ws)`, `listTeams(ws)`, `findTeam(ws, id)`, `teamsOfMember(ws, memberId)`,
  `platformPermissionsOf(ws, memberId): PlatformPermission[]`, `requireMayGrant(actorPerms, perms)`,
  `createTeam(ws, {id,name,description?,members?,permissions?}, actor, actorPerms, via?)`,
  `updateTeam(ws, id, {name?,description?,members?,permissions?}, actor, actorPerms, via?)`,
  `setTeamPermissions(ws, id, perms, actor, actorPerms, via?)`, `deleteTeam(ws, id, actor, via?)`.
  `Team { workspace, id, name, description, members, builtIn, locked, permissions, effective, createdAt }`.
- Members: `Member { workspace, id, subject, email, name, teams, avatar? }`, `addMember`,
  `joinMember({workspace,email,teams,via,subject?,name?})` (unknown team ids dropped),
  `setMemberTeams(ws, id, teams, actor, actorPerms, via?)`, `removeMember(ws, id, actor)`,
  `inviteMember(ws, {email, teams, invitedBy, expiresAt, actorPermissions})`,
  `getMembershipSettings(ws) -> {domains, defaultTeams} | undefined`,
  `setMembershipSettings(ws, {domains, defaultTeams}, actor, actorPerms)`.
- Access: `accessGrants(toolId, manifest?)`, `seedAccessGrants`, `setAccessGrants(toolId,
  [{subject, grant}], actor, via?)`, `accessExceptions`, `setAccessException(s)`,
  `updateAccess(toolId, {grants?, changes?}, actor, via?)`, `accessFor(toolId, subjects, manifest?) ->
  {permissions, access}`, `accessMatrix(toolId) -> {subjects, subjectLabels, actions, views, columns,
  cells, levels, permissions, profiles, grants}`.
- Library/catalog: `Availability { mode: nobody|everyone|teams|people, teams, people }`,
  `isAvailable(rule, {id, teams, permissions})` (`access:write` always passes),
  `mayUseChannel(rule, {id, teams, permissions}, ref)`, `reachesChannelAlways(ref, {permissions})`
  (`tools:publish` every channel, `tools:read` non-`~`), `listCatalog`/`findCard` take
  `caller: { subjects }`.
- Identity: `createIdentityConfig` → `groupTeams` (OIDC and SAML).

## Platform contract

- `members.ts`: `MemberSchema {id,email,name,teams}`, invitations `teams`, settings
  `{domains, defaultTeams, source}`, `MAX_TEAMS`, `setMemberTeamsRoute` (`PATCH /api/members/{id}`
  `{teams}`), `POST /api/invitations` `teams?`, `PUT /api/membership-settings` `defaultTeams?`.
- `teams.ts`: `TeamSchema {id,name,description,members,builtIn,locked,permissions,effective}`; create
  and PATCH accept `permissions`; `listPermissionsRoute` `GET /api/permissions` → `{groups: [{label,
  permissions: [{name,label,description,implies}]}]}` (built by the gateway from `PLATFORM_GROUPS`).
- `access-matrix.ts`: response above; PUT `{changes: [{subject, action, allowed|null}], grants:
  [{subject, grant}]}`; `MAX_GRANT_CHANGES`.
- `workspace.ts`: `person {id, email, name, teams, permissions, avatar?}`.
- `bearer.ts` whoami: `teams`, `permissions`. `library.ts`: mode `open|nobody|everyone|teams|people`,
  field `teams`. `marketplaces.ts`: card `profiles`. 403s say "Lacks the permission".

## CLI (already done)

`dev`/`play` `--as <profile>|all`, `--team`; `db --write` (the platform must require `tools:data`).
Not done: `apps/cli/src/commands/admin.ts` (+ test), `secrets.ts` texts.
`packages/scaffold/src/lifecycle.ts` is generated from `docs/lifecycle.md` by `bun scripts/lifecycle.ts`.
