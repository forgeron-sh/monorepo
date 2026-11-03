# Console UX

How the console and the member space are organised. `docs/design-system.md` stays authoritative for the
look (black and white, sharp corners, Inter and JetBrains Mono, environments told apart by shape); this
page decides the structure: where things are, what a screen contains, how a person moves between them.

The structure comes from products people already know. We take their logic, never their colours or their
rounded corners. References on Mobbin are linked so each screen can be looked at before it is built.

## Principles

1. **One thing per place.** A person never has to guess where something lives. Workspace-wide things are
   in Settings, a tool's things are on the tool's page.
2. **The sidebar is for navigation, not branding.** No product name, no repeated workspace name.
3. **Admin and member see the same product.** Members get the member space (below); admins get the same
   plus the administration pages. A page a person may not use is not shown, never shown disabled.
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
- **Navigation, grouped:** Home, Tools (the tool list; each tool is a child item when the list is short),
  then for admins: Members, Approvals, Audit log. Settings is at the bottom of the navigation, not a page
  among others.
- **Bottom of the sidebar: the person's menu.** Avatar, name; opens a popover with theme (system, Forge,
  Atelier), documentation, sign out. No branding line.
  [Vercel](https://mobbin.com/screens/a8d666ee-3303-4b28-9e1f-06b8dbd63cb6).
- Collapses to a drawer at phone width; keyboard: `g` then a letter to go to a section, `/` to search.

## Settings

A full area with its own sidebar, as in Linear: a "Back to app" link on top, then sections.
[Linear preferences](https://mobbin.com/screens/d4e47b31-9152-40c7-a400-c6725e8de647),
[Linear team settings](https://mobbin.com/screens/34342fdd-7c3d-4f23-ab9d-bc1a62ec4fbb),
[Vercel project settings](https://mobbin.com/screens/11def438-b12a-4f4c-938e-ec13525dd1dd).

| Group                   | Pages                                                                                                                                                                 |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Account                 | Profile, Preferences (theme, language), Security (sessions, tokens, `forgeron login` devices), Connected accounts (the person's connector consents), Personal secrets |
| Workspace (admins)      | General (name, address), Members, Roles and access, Sign-in (email, OIDC, SAML), Domains                                                                              |
| Administration (admins) | Audit log, Approvals, Usage and seats, Install information (version, address, binding health)                                                                         |

A settings page is a column of titled **groups**; a group is a card of **rows**: label and description on
the left, the control on the right; a row that opens a sub-page ends with a chevron; a **Danger zone** group
comes last. Source of the pattern: `docs/settings-reference` and `apps/web/src/features/settings` of the
owner's Linear clone (see "Where to look").

## Tools

### List

A table or a grid (toggle), searchable: icon, name, one-line summary, production version, number of
previews, last deployment, status dot. A row opens the tool page.
[Vercel projects](https://mobbin.com/screens/c54df5c8-f72c-406e-bb92-a9a6b116f0a5).

### Tool page

Header: icon, name, summary, the **Open** and **Connect** buttons. Tabs:

| Tab          | Content                                                                                                   |
| ------------ | --------------------------------------------------------------------------------------------------------- |
| Overview     | The tool's README as markdown (see "Member space"), what it exposes, the people and roles that may use it |
| Branches     | Production and the previews, see below                                                                    |
| Versions     | Versions with their changelog, compared to the previous one                                               |
| Architecture | A diagram generated from the manifest                                                                     |
| Database     | The explorer, see below                                                                                   |
| Access       | The roles by actions matrix                                                                               |
| Secrets      | Which secrets are set, never their values                                                                 |
| Activity     | The tool's audit log                                                                                      |

Admin-only tabs are not shown to members. A member lands on Overview and sees only what they may use.

### Branches

The deployment list of Vercel and the environment settings of Vercel/Cloudflare, with our vocabulary:
[Vercel deployments](https://mobbin.com/screens/ac75e179-8e00-463a-9cba-b20d424db41c),
[Vercel environments](https://mobbin.com/screens/11def438-b12a-4f4c-938e-ec13525dd1dd),
[Vercel instant rollback](https://mobbin.com/screens/f10497e6-9a53-4d09-b1fe-e72cebede2a6).

- First row: **Production**: version, commit, who deployed, when, address, the `Roll back` action.
- Then one row per **branch** (one preview per branch): branch name with a branch glyph, commit short hash
  and message, author, age, status dot (ready, building, failed), version, the preview address with copy
  and open buttons, a menu: Promote to production, Close preview.
- Filter bar: status, author, branch search. Environments are told apart with `EnvTag` shapes.
- **Promote** and **Roll back** open a dialog that shows the from and to versions, the changelog entries
  and the impact (major, minor, patch), asks for a reason, and says that migrations are not rolled back.
- A branch row expands to show its database, its last migration, and its recent deployments.

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

- Left: the tables of the selected environment or branch, with a search field and a row count.
- Centre: a data grid with typed column headers, constraint chips (primary, not null, unique, foreign
  key), paging, sorting, a filter bar, a row detail drawer, copy and export as CSV.
- A "Definition" view of a table (columns, indexes, foreign keys) and a schema view (tables and their
  relations).
- **Read only**, admins and the tool's developers, row limits, every access written to the audit log,
  personal data columns are masked by default.

## Member space

What a person who is not an administrator sees. They sign in and land on **Home**:

- **My tools**: the tools they may use, as cards (icon, name, summary, how to open).
- **Catalog**: the tools of the workspace they do not use yet, each with its card and what is needed to
  get access (a role to ask an admin for).
- A person's **Connect** instructions per tool: the MCP address and how to add it to Claude, the API
  address and a token, the CLI command. Copy blocks.

### Tool card (the Overview tab)

For admins and members alike. The pattern of an app directory:
[Twenty](https://mobbin.com/screens/5a9b57e5-c736-4000-9772-da12bf1c33f3),
[GitBook](https://mobbin.com/screens/431254e3-9be9-4945-8e49-6eb1eb8f42c1),
[Zendesk](https://mobbin.com/screens/5f0e6be7-da0e-415a-ac9b-0ad2df79c0a5),
[Midday](https://mobbin.com/screens/8cc91858-df36-4bdf-8a6d-69f1d2bd602e).

- Header: icon, name, summary, a primary button (Open or Connect).
- Left column: the README, rendered markdown: headings, lists, tables, code blocks, links, **images** of
  the tool's repository. Tabs "About" and "How to install".
- Right column: details: version, last release, interfaces (MCP, API, CLI, Web), roles that may use it,
  required secrets and connectors (what the person will be asked for), links (repository, docs).
- The README is the tool's `README.md` and the images it references; they are collected at build and
  stored with the version. Rendering never executes anything: no raw HTML, no scripts, images only from
  the bundle.

## Code organisation

- `apps/console/src/shell`: the shell, the route table, the settings layout. One route table
  (`routes.ts`): a route is a path, a title, who may see it and a lazy page.
- `apps/console/src/features/<domain>/`: `pages`, `components`, `api.ts` (typed calls to the console API),
  one folder per domain (tools, members, settings, database, portal). A feature never imports another
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
