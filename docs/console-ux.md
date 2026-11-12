# Console UX

How the console and the member space are organised. `docs/design-system.md` stays authoritative for the
look (black and white, sharp corners, Inter and JetBrains Mono, environments told apart by shape); this
page decides the structure: where things are, what a screen contains, how a person moves between them.

The structure comes from products people already know. We take their logic, never their colours or their
rounded corners. References on Mobbin are linked so each screen can be looked at before it is built.

## Principles

1. **One thing per place.** A person never has to guess where something lives (D-128): what is theirs
   is in their space (Home, My tools, Discover), what an admin manages is in Administration (Tools,
   Marketplace, Members, Roles and access), how the workspace is configured and recorded is in
   Settings, a tool's things are on the tool's page. A page exists in one place only; an address that
   moved redirects to the new one.
2. **The sidebar is for navigation, not branding.** No product name, no repeated workspace name.
3. **Admin and member see the same product.** Everyone gets the member space (below); admins get the
   same plus the Administration section and the workspace's settings. A page a person may not use is not
   shown, never shown disabled; its address says the page is for admins.
4. **Every list has an empty, a loading and an error state, and a way to act from the empty state.**
5. **Code and identifiers are first-class**: addresses, versions, commit hashes, CLI commands are in
   `mono`, with a copy button.
6. **Dangerous actions are named and confirmed** (type the name for deletions), and say what happens.

## Shell

- **Top of the sidebar: one workspace switcher.** The workspace name with a chevron; the logo mark is its
  icon. It opens a menu: the workspaces the person belongs to, "Workspace settings", "Invite people".
  Nothing else: no "Forgeron", no second label.
  [Vercel](https://mobbin.com/screens/a8d666ee-3303-4b28-9e1f-06b8dbd63cb6),
  [Plane](https://mobbin.com/screens/675ba224-6259-48bc-9cae-2bd3c712bf55).
- **Navigation, grouped (D-128):**

  | Section                                   | Items                                                                                             | Addresses                                                              |
  | ----------------------------------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
  | The person's space (everyone, no heading) | Home, My tools (the tools they added), Discover (the tools the workspace makes available to them) | `/`, `/library`, `/discover`; a tool `/library/<tool>`                 |
  | Administration (admins)                   | Tools (every tool of the workspace, the admin's view), Marketplace, Members, Roles and access     | `/admin/tools`, `/admin/marketplace`, `/admin/members`, `/admin/roles` |
  | Settings (bottom, its own area)           | Account for everyone; Workspace and Operations for admins                                         | `/settings/...`                                                        |

  A developer who is not an admin sees Administration with Tools only (D-118). A person who holds no
  role but `member` sees their space and Settings, Account. There is no screen of approvals: what a
  version asks for is approved in the dialog that installs or updates it (D-121, D-125). Settings is at
  the bottom of the navigation, not a page among others.

- **Moved addresses redirect** (`shell/redirects.ts`), the rest of the address kept (`?tab=`,
  `?invite`): `/members` and `/settings/members` → `/admin/members`, `/settings/roles` →
  `/admin/roles`, `/audit` → `/settings/audit`, `/tools/...` → `/admin/tools/...`,
  `/marketplace/...` → `/admin/marketplace/...`.
- **Bottom of the sidebar: the person's menu.** Avatar, name; opens a popover with theme (system, Forge,
  Atelier), documentation, sign out. No branding line.
  [Vercel](https://mobbin.com/screens/a8d666ee-3303-4b28-9e1f-06b8dbd63cb6).
- Collapses to a drawer at phone width; keyboard: `g` then a letter to go to a section (`h` Home, `m`
  My tools, `d` Discover, `t` Tools, `k` Marketplace, `p` Members, `r` Roles and access, `s`
  Settings), `/` to search.

## Settings

A full area with its own sidebar, as in Linear: a "Back to app" link on top, then sections.
[Linear preferences](https://mobbin.com/screens/d4e47b31-9152-40c7-a400-c6725e8de647),
[Linear team settings](https://mobbin.com/screens/34342fdd-7c3d-4f23-ab9d-bc1a62ec4fbb),
[Vercel project settings](https://mobbin.com/screens/11def438-b12a-4f4c-938e-ec13525dd1dd).

| Group               | Pages                                                                                                                                                                 |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Account             | Profile, Preferences (theme, language), Security (sessions, tokens, `forgeron login` devices), Connected accounts (the person's connector consents), Personal secrets |
| Workspace (admins)  | General (name, address: the primary origin, D-126), Sign-in (email, OIDC, SAML), Domains, GitHub (the workspace's GitHub App, D-123)                                  |
| Operations (admins) | Audit log, Usage and seats, Sealing key, Install information (gateway version and commit, address)                                                                    |

Members and Roles and access are not settings: they are in Administration (D-128). The workspace's audit
log is in Settings only; a tool's own log is its Activity tab.

A settings page is a column of titled **groups**; a group is a card of **rows**: label and description on
the left, the control on the right; a row that opens a sub-page ends with a chevron; a **Danger zone** group
comes last. Source of the pattern: `docs/settings-reference` and `apps/web/src/features/settings` of the
owner's Linear clone (see "Where to look").

## Administration

For admins (D-128), at `/admin/...`. **Members** lists the people and invitations and changes roles;
everyone holds `member` without being given it, so the role pickers do not offer it and the list shows
it beside the given roles. **Roles and access** lists the workspace roles with how many people hold each
(`member`: everyone) and, per tool, the way to its Access tab.

## Tools

The admin's view of every tool (`/admin/tools`), in Administration; developers see it too (D-118).

### List

A table or a grid (toggle), searchable: icon, name, one-line summary, production version, number of
previews, last deployment, status dot. A row opens the tool page.
[Vercel projects](https://mobbin.com/screens/c54df5c8-f72c-406e-bb92-a9a6b116f0a5).

**Add from GitHub** (admins, D-121): the tool's name, its repository (`owner/name`, one tool per
repository) and its production branch (`main` by default). The tool is created with no environment and
nobody may add it yet; the dialog then shows, once, the deployment token to set as the repository's
`FORGERON_TOKEN`, and the steps: the secret, the workflow `forgeron init` writes, a first push.

With the workspace's **GitHub App** (D-123), the same button lists the repositories its installations
see: each says whether it holds a tool (`forgeron.config.ts`) and which tool it is already linked to (then
it cannot be picked). Picking one fills the tool's name and production branch; a checkbox adds the
workflow when the repository has none. No token is shown: its CI deploys with GitHub's identity. "Use a
token instead" opens the dialog above.

**New tool** (admins, D-123): a name and an organisation the app is installed on. Forgeron makes a private
repository with what `forgeron init` writes, links it, and its first push deploys the first preview.
Without the app, the dialog says to connect GitHub first.

**Settings → GitHub** (admins, D-123): not connected, the organisation (empty for one's own account) and
"Create the GitHub App", which goes to GitHub with Forgeron's manifest and comes back. Connected, the app,
its installations, "Install on GitHub", and a danger zone to disconnect it (it stays on GitHub).

### Tool page

Header: icon, name, summary and, at the right, the **channel** the page shows (D-120, D-125):
_Production_ at `/admin/tools/<tool>`, another channel at `/admin/tools/<tool>/tree/<ref>`, where `<ref>` is a
branch for a branch's temporary channel and `~<name>` for a permanent channel (`~staging`). Changing it
keeps the open tab (`?tab=`). On another channel, a band under the header says which one (_Channel_ or
_Branch_), that what is changed there is for that channel only, with its own data, and offers to go back
to production. A channel that is gone shows production with a word about it, and the address goes back
to `/admin/tools/<tool>`. The picker lists production, the other permanent channels with their version, then
the branches. It has no label: it is as wide as its value, its chevron right after it (D-129).

Right of the picker, for admins, the channel's **publication** (D-129), described below under
"Publication".

| Tab          | Follows the channel | Content                                                                                     |
| ------------ | ------------------- | ------------------------------------------------------------------------------------------- |
| Overview     | yes                 | The README, guide, version and addresses of the version the channel serves                  |
| Channels     | no                  | The permanent channels with their updates, then one temporary channel per branch, see below |
| Releases     | no                  | The releases with their changelog, compared to the previous one; builds on demand           |
| Architecture | yes                 | A diagram generated from the manifest the channel serves                                    |
| Database     | yes                 | The explorer, on the channel's database                                                     |
| Access       | no                  | The tool's profiles, what each workspace role is given, the exceptions by action (D-127)    |
| Secrets      | yes                 | Production: both kinds and what people hold. Another channel: the `preview` secrets it uses |
| Activity     | no                  | The tool's audit log                                                                        |

**The Access tab** (D-127) has three parts, saved together with one **Save changes**:

1. _Profiles this tool suggests_: each profile with its label, its name, its permissions, and the
   default one marked.
2. _What each workspace role is given_: a row per workspace role (those of the members, invitations
   and the base ones, `admin`, `member` first). Everyone holds `member` (D-128): its row is what a
   person with no other role gets. A select gives the role _No access_, a profile (by its
   label), _Custom permissions_ (then a checkbox per permission of the tool) or _All permissions_; the
   permissions it ends up with are listed. A new tool arrives with `admin`: all, `member`: the default
   profile.
3. _Exceptions by action_: the roles by actions matrix (D-039). A cell shows what applies, and says
   when it differs from what the role's mapping gives. Changing a role's mapping in the draft updates
   the defaults of its cells at once.

On another channel, a tab that does not follow it says _The same for every channel._ above its content:
it is shown, not hidden, so the tabs do not move when the channel changes. Admin-only tabs are not shown
to members.

### Channels

The deployment list of Vercel and the environment settings of Vercel/Cloudflare, with our vocabulary
(D-125): a branch is where people work, a channel is where the tool is distributed.
[Vercel deployments](https://mobbin.com/screens/ac75e179-8e00-463a-9cba-b20d424db41c),
[Vercel environments](https://mobbin.com/screens/11def438-b12a-4f4c-938e-ec13525dd1dd),
[Vercel instant rollback](https://mobbin.com/screens/f10497e6-9a53-4d09-b1fe-e72cebede2a6).

- On top, for admins, **Permanent channels**: where the tool comes from (a marketplace, or a GitHub
  repository), then one card per permanent channel, production first: the branch it follows, the
  version it serves, _Update by itself_, and the release waiting for it: its version and branch, its
  changelog, what it asks for that production does not have, the migrations that will run. _Update
  <channel>_ needs the admin to tick _I approve what it asks for_ when it asks for something, and _Run
  it: the data it drops is gone_ for a destructive migration. A conflict of the plan (a migration the
  channel's database applied and the release lacks, an edited one…) stops it, with _Copy prompt for
  your agent_ and the command that shows the channel's migrations: it is fixed on the branch, in Git. A
  channel other than production has _Remove_ (its name typed to confirm; its Worker and database go).
  _Add a channel_ asks a name (`staging`, lowercase), the branch it follows and whether it updates by
  itself; it starts empty, with its own access rule.
- Then the rows of the **permanent channels** that serve something: version, commit, who deployed, when,
  address, the `Roll back` action (to a release it served before).
- Then **Branches**, one temporary channel per pushed branch: branch name with a branch glyph, commit short
  hash and message, author, age, status dot (ready, building, failed), version, the address with copy and
  open buttons, a menu: Close channel. There is no promotion: a branch reaches production by being merged
  in Git into the branch production follows, then released there.
- Filter bar: status, author, branch search. Channels are told apart with `EnvTag` shapes (Production,
  Channel, Branch).
- **Roll back** opens a dialog that shows the from and to versions, the changelog entries that leave and
  the impact, asks for a reason, and says that migrations are not rolled back.
- A branch row expands to show its database, its last migration, and its commits (the deployments
  Forgeron recorded: sha, message, author, date).

## Marketplace

For admins (D-116), at `/admin/marketplace`. One tab per marketplace: **Official** (the platform's catalogue) first, then each
GitHub repository the workspace added. A tab says where the marketplace lives, when it was last synced,
whether it is read with a token, and why the last sync failed; _Sync_ reads its index again and says,
tool by tool, what was added, already there, not published yet or refused (and why). The tools are
cards (title, summary, version, _Installed_, how many resources they ask for). Opening the screen syncs,
after the answer, the marketplaces read more than an hour ago (D-121): no cron.

- **Add a marketplace**: a dialog with the repository (`owner/name`) and, for a private one, a read
  token (GitHub fine-grained, _Contents: read_). The token is sealed and never shown again; a first
  sync runs at once.
- **The technical sheet** (`/admin/marketplace/<id>/<tool>`): the README, _What its users read_ (the guide,
  as a member will see it), the actions with their access level, the changelog; on the right the
  version, interfaces, roles, database, outbound hosts, secrets an admin sets, what each person is
  asked for, connectors and what it asks for. _Install_ asks for a confirmation that lists what it asks
  for, with _I approve what it asks for_; the tool is created, approved and put in production where the
  gateway can deploy, then its page opens, a draft until an admin publishes it (D-129). A newer release shows in its Updates (D-121).
- **Remove** a marketplace: its token and what it offers go; the tools installed from it stay.

## Architecture diagram

Generated from the tool's manifest, no hand drawing: the four interfaces (MCP, API, CLI, Web) on the left,
the actions grouped by group in the middle with their access level, the resources on the right (database
tables, connectors, secrets, allowed outbound hosts), events and tasks below, the other tools it uses.
Lines show which action touches which resource. Static SVG in the design system's colours, readable in
both themes, with every node a focusable element and a text alternative.

## Database explorer

Modelled on the Supabase table editor and schema visualizer:
[tables](https://mobbin.com/screens/9371b311-f2fb-431d-9d20-0a7222b7e0b9),
[table editor](https://mobbin.com/screens/dd17a25f-3822-4b14-a2fa-ce5a70b8f0be),
[sorting](https://mobbin.com/screens/b2f6f6c1-8f63-4634-b1e9-930ee16aa838).

- Left: the tables of production or of the branch chosen at the top of the tool page (D-120), with a
  search field and a row count.
- On a branch: _Replace with another branch's data_ (D-121). The other branch is chosen and the tool's
  name typed; the branch's tables are emptied, then filled with the other branch's rows. Production's
  data is never read nor replaced, and two branches on different migrations are refused.
- Centre: a data grid with typed column headers, constraint chips (primary, not null, unique, foreign
  key), paging, sorting, a filter bar, a row detail drawer, copy and export as CSV.
- A "Definition" view of a table (columns, indexes, foreign keys) and a schema view (tables and their
  relations).
- **Read only**, admins and the tool's developers, row limits, every access written to the audit log,
  personal data columns are masked by default.

## Member space

What a person sees: their **library** (D-117), in three items of the sidebar (D-128). Nothing on them is
technical: no version, role, action, interface or resource.

- **Home** (`/`): where they land. Their tools (the first six, with _All my tools_), then, when the
  workspace offers them tools they have not added, how many and _Discover tools_. An admin also sees
  the workspace's numbers with _Invite people_, and the first-run checklist until it is done.
- **My tools** (`/library`): the tools they added, as cards (icon, title, the tool's `summary`), with a
  search. _Use_ opens the tool's page of the library; a tool that still asks for something (their own
  key, an account) says _Setup to finish_ and its button is _Finish setup_. Empty, it leads to Discover.
- **Discover** (`/discover`): the tools an admin opened to them that they have not added, with a search.
  _Add_ puts the tool in their library and opens its page, where they finish its setup and see how to
  use it.
- A tool deployed before libraries (no rule yet) is in the library of everyone who may call it, and
  cannot be removed.

### A channel other than production

A channel an admin opened to some people (D-119, D-125) is a tool of its own in their library: a card
marked _Channel · staging_ for a permanent channel or _Branch · feat_ for a branch's, and a page
(`/library/<tool>/pilots/<ref>`, `<ref>` being the branch or `~<name>`) that says it has its own data.
Adding, finishing the setup and removing work as for a tool, apart from it.

### Publication (admin, the header of the tool page)

Who may use a channel (D-129), in place of the Availability tab, which is gone (`?tab=availability`
opens the tool page). Two states, on the existing rule (D-117, D-125; the API is unchanged). The
state is a badge next to the tool's name (_Draft_ or _Published_; who it reaches is its tooltip and
_Who has access_). Right of the header, all 32 px high: the channel picker, the split button, always
filled black, and a square arrow link to the tool in the person's own space (`/library/<tool>`).

- **Draft** (`nobody`, or a channel with no rule yet): admins only. A branch's temporary channel stays
  open to developers too (D-125). A tool installed from a marketplace and a new permanent channel start
  as drafts. The badge reads _Draft_ (tooltip _Admins only_) and a **split button**: _Publish_, and glued to
  its right a chevron with _Who has access_.
- **Published** (`everyone`, `roles` or `people`): the badge reads _Published_, its tooltip _everyone_, _developer,
  support_ or the people's names (their count past two). The main button becomes _Manage
  sharing_; the chevron holds _Who has access_ and _Unpublish_ (confirmed, it says how many people lose
  access; their library keeps the tool).
- **The dialog** (_Publish_ and _Manage sharing_): everyone in the workspace, some roles (every role but
  `admin` and `member`: admins always have access, and `member` is everyone, D-128), or some people
  found with a search field. Before saving it says how many people will have access and why (_3 people
  will have access, of 12: admins, and the people who hold support._).
- Production with no rule (deployed before libraries) reads _Published_ (tooltip _everyone, without adding it_);
  saving a choice means each person adds it from their library to keep using it, and the dialog says so.

On production the rule is who may add the tool to their library; on another channel, who may add that
channel as a tool of its own. What a person may do in the tool stays the Access tab.

### A tool in the library (the member's sheet)

`/library/<tool>`, for anyone (D-118). Icon, title, the tool's `summary`, then:

- **Add to my tools** when it is not added; adding a tool that asks for something goes straight to its
  setup page, which comes back here. **Finish setup** while something is missing, with a notice that
  says what is kept and for whom.
- **About**: the tool's guide (`GUIDE.md`), or its summary when it has none.
- **Use it** (once added and set up, opened by default): in the browser (_Open_), in Claude (the address
  to paste as a custom connector, and the steps), in a terminal (`forgeron login`, then the command).
- **Remove from my tools**, with a confirmation that says the tool stops working for them and that their
  saved keys stay in their secrets.
- When the tool is added but the person's roles open nothing in it (`allowed: false`, D-127): a notice.
  An admin is sent to the tool's Access tab to give one of their roles a profile; anyone else is told
  to ask an admin.

No version, action, interface name, resource or README.

### Tool card (the Overview tab)

For admins and developers: the technical sheet (D-118). The Tools screens (Administration) are theirs; a
member reaches a tool through their library. The pattern of an app directory:
[Twenty](https://mobbin.com/screens/5a9b57e5-c736-4000-9772-da12bf1c33f3),
[GitBook](https://mobbin.com/screens/431254e3-9be9-4945-8e49-6eb1eb8f42c1),
[Zendesk](https://mobbin.com/screens/5f0e6be7-da0e-415a-ac9b-0ad2df79c0a5),
[Midday](https://mobbin.com/screens/8cc91858-df36-4bdf-8a6d-69f1d2bd602e).

- Header: icon, name, summary, a primary button (Open or Connect).
- Left column: the README, rendered markdown: headings, lists, tables, code blocks, links, **images** of
  the tool's repository. Tabs "About", "What its users read" (the guide, when there is one) and "How to
  install".
- Right column: details: version, last release, interfaces (MCP, API, CLI, Web), roles that may use it,
  required secrets and connectors (what the person will be asked for), links (repository, docs).
- The README is the tool's `README.md` and the images it references; they are collected at build and
  stored with the version. Rendering never executes anything: no raw HTML, no scripts, images only from
  the bundle.

### Catalog API

Typed in `@forgeron/manifest` (`catalog.ts`: zod schemas and types) and declared as route objects in
`@forgeron/platform-contract` (`catalog.ts`), which the gateway serves with Hono and the console calls
through the contract's typed client (D-066). All routes are under `/console-api`, answer JSON with `cache-control: no-store`, and are for **any signed-in
member** (anonymous: `401`). A tool nobody may use is listed too.

| Route                                   | Answer                                                                                                 |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `GET /api/catalog`                      | `{ tools: CatalogTool[] }`, sorted by name                                                             |
| `GET /api/catalog/<tool>`               | a `ToolCard`; `404` for an unknown tool                                                                |
| `GET /api/catalog/<tool>/assets/<path>` | an image of the bundle (`path` as in `assets[].path`)                                                  |
| `GET /api/openapi.json`                 | the OpenAPI 3.1 document of the routes the contract serves; for any signed-in member, like the catalog |

Any other method on a catalog route is `405` (even for someone not signed in); `HEAD` on an image answers
the headers without the body.

`CatalogTool`: `{ name, title, summary, icon, productionVersion, interfaces: { mcp, api, cli, web },
access, roles }`.

- `title` is the config's `title` or the name; `summary` is the config's `description` or `""`.
- `icon` is a URL or `null`; `productionVersion` is `null` before the first production deployment.
- `access` is `granted` when the person's workspace roles, mapped to the tool's permissions (D-127)
  and with the admin's exceptions, may call at least one action, else `requestable`. `roles` lists the
  workspace roles that may call at least one action, `{ name, label }`, the label saying what the role
  is given (`member (User)`, `admin (all permissions)`).
- The card and the runtime use the same check. An admin whose roles open nothing (an admin took the
  access away from `admin`) is told to give one of their roles a profile in the Access tab, never to ask
  an admin; anyone else is told to ask an admin. There is no "give yourself the role" wording: tools
  have no roles to give.

`ToolCard` is a `CatalogTool` plus:

| Field                 | Content                                                                                        |
| --------------------- | ---------------------------------------------------------------------------------------------- |
| `readme`              | The README, markdown source (a JSON string), or `null`. The client renders it without raw HTML |
| `assets`              | `{ path, type, size, url }[]`: the images the README references, and the icon                  |
| `connect`             | `{ mcp: { url } \| null, api: { baseUrl } \| null, cli: { command } \| null }`                 |
| `requiredSecrets`     | `{ name, why }[]`: set by an admin, informative                                                |
| `requiredUserSecrets` | `{ name, label, why }[]`: what the person is asked for                                         |
| `connectors`          | `{ name, type, mode }[]`                                                                       |
| `yourAccess`          | `{ action, allowed }[]`, one per action                                                        |
| `lastRelease`         | `{ version, date, changelog } \| null`: the latest published version                           |

Rendering the README: markdown only; raw HTML is dropped, links open with `rel="noopener noreferrer"`,
an image whose address is not one of `assets[].url` is not shown.

**Images** are served by the console API (not under `/t/<tool>`, which belongs to the tool), from the
stored bundle, so only a signed-in member reads them. The `url` of an asset ends with `?v=<sha256>`: the
answer is `cache-control: private, max-age=31536000, immutable`, `x-content-type-options: nosniff`, a
`content-type` from the allow list (png, jpeg, webp, gif, svg), and
`content-security-policy: default-src 'none'; style-src 'unsafe-inline'; sandbox`. A path with `..`, a
backslash or a NUL, or not in the bundle, is `404`.

**At build**, `forgeron build` reads `README.md` of the tool folder and the images it references with a
relative path (`![](docs/a.png)`, `<img src="docs/a.png">`), plus the `icon` of the config. A file is
refused, with a build error naming it, when it is outside the tool folder (`..`, a symlink that leaves it),
over 1 MB, of another type, or an SVG holding a script, an event handler or an external reference; the
total is limited to 5 MB. The manifest keeps the hashes (`docs`), the platform stores the content with the
version.

## Code organisation

- `apps/console/src/shell`: the shell, the route table, the settings layout. One route table
  (`routes.ts`): a route is a path, a title, who may see it and a lazy page.
- `apps/console/src/features/<domain>/`: `pages`, `components`, `api.ts` (typed calls to the console API),
  one folder per domain (tools, admin, settings, database, portal, marketplace). A feature never imports another
  feature's internals; it exports its pages and tabs. The tool page's tabs are a registry
  (`features/tools/tabs.ts`) that features add to.
- `packages/ui`: presentational components only, stateless, no data fetching, no workspace identity; every
  exported component has a preview in the design system pages with fixed fake data, and a test.
- Pages own routes, data, permissions, mutations and errors.

## Checking a screen

Every screen is looked at in a browser, in both themes and at 375 px width, with the keyboard only, before
its pull request is opened. The pull request body lists what was checked and what was not. A local harness
with a mocked console API (no real secrets) lets a screen be opened without a workspace.

## Where to look

- The owner's Linear clone, `~/Developer/Personnal/linear` (read only): `apps/web/src/features/settings`
  and `apps/web/src/features/*` for how a product of this size is split into features, `packages/ui` and
  `apps/gallery` for presentational components with stories, `docs/settings-reference` and
  `docs/sidebar-reference` for measured references of the settings area and the sidebar, `design-qa.md`
  for how a visual check is written down.
- Mobbin, through the Mobbin tools, for any screen not listed here.

## Extension points

What other work builds on; the shell itself is not edited to add a screen (D-056).

### A page

1. Create `apps/console/src/features/<domain>/pages/<name>.tsx` with a **default export** component taking
   `PageProps` (`shell/page-props.ts`): `ws` (the workspace and the person), `api` (`fetchJson`,
   `sendJson`), `now`, `go(href)`, `params` (the `:name` segments), `refreshPending()`.
   The page draws a `Page` from `@forgeron/ui` and owns its loading, empty and error states.
2. Add it to `apps/console/src/features/<domain>/routes.ts`, which default-exports a `RouteDef[]`:

```ts
import type { RouteDef } from "../../shell/routes";

const routes: RouteDef[] = [
  {
    path: "/admin/tools/:name", // `:name` is read into `params.name`
    title: "Tool",
    access: "everyone", // "everyone" | "member" | "developer" | "admin"
    page: () => import("./pages/tool-page"),
    // nav: { group: "main" | "admin", label: "Tools", shortcut: "t", order: 10 }  // a sidebar item, not for `:` paths
    // settings: { group: "account" | "workspace" | "operations", label: "Profile" }
  },
];
export default routes;
```

`routes.ts` is loaded when the console starts: keep it to route definitions and tab registrations, and
import pages lazily. `shortcut` is the letter after `g` (`g` then `t`); letters are unique across the table
(a test checks it). A person who may not see a route does not get its menu item, and the address answers
"This page is for admins."

### A tool page tab

```ts
import { registerToolTab } from "../tools"; // in features/<domain>/routes.ts

registerToolTab({
  id: "architecture",
  title: "Architecture",
  adminOnly: false,
  scope: "branch", // "branch": follows the branch of the page (D-120); "tool": the same for every branch
  order: 40, // optional: low first (default 100, then registration order)
  load: () => import("./components/architecture-tab"), // default export taking ToolTabProps
});
```

`ToolTabProps` is `{ tool, branch?, ws, api, now }`; `branch` is given to a `"branch"` tab on a branch's
page only, so `undefined` means production. The tool page (FOR-130) calls `toolTabs(admin)` and draws what
comes back; an `adminOnly` tab is neither shown nor loaded for a member.

### Folders

`features/<domain>/{pages,components,api.ts,routes.ts,index.ts}`. `index.ts` exports what another feature
may use (a type, a registry function); anything else is private. `api.ts` holds the typed calls to the
console API (`/api/...` paths through `api.fetchJson` / `api.sendJson`). The table and the matcher are
`shell/routes.ts`; `hrefOf("/admin/tools/:name", { name })` builds an address. A page that moves keeps
its old address working with an entry in `shell/redirects.ts`, never with a second route.

### The settings area

A route with `settings: { group, label }` is a page of the settings area (the shell draws its sidebar and
the "Back to app" link); `access` decides whether a person sees it, so Account pages are `everyone` and
the others `admin`. `features/settings/routes.ts` holds the pages of D-058. A settings page is a `Page`
holding a `SettingsStack` of `SettingsGroup`s (titled cards) of `SettingsRow`s (`@forgeron/ui`); a Danger
zone is a `SettingsGroup tone="danger"`, last. A page for which the platform has no data yet shows an
`EmptyState` saying so, never invented values.
