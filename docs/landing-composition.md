# Landing composition — forgeron.sh home page

The home page tells one story, in this order: **what Forgeron is for** (pick a tool, shape it with AI, ship it), then **how it works underneath**, then **how you work with it** (develop, host), then the extras. The technical schemas stay, but they move after the concept.

This page is the composition: the order of the sections, the copy, the visual of each, and what is real today against what is announced. The page itself is `apps/site/src/pages/index.astro`.

## Positioning in one line

> Pick a ready-made tool, shape it to your team with AI, and ship it to your people and your agents in one click.

What changes from the previous page: the previous page sold an SDK ("write a tool once, four interfaces"). The new one sells a result (a CRM, a help desk that fits your team), and keeps the SDK as the proof underneath.

## Real today, or announced

The page announces some things that are not built yet. Each one wears a `Soon` tag on the page, never a claim in the present tense.

| Item on the page                                  | State (17 Nov 2026)                                                  |
| ------------------------------------------------- | -------------------------------------------------------------------- |
| Catalog: CRM, data hub, dashboard                 | Real: `templates/crm`, `templates/inventory`, `templates/dashboard`  |
| Catalog: help desk, ticketing, notes              | Announced (`Soon`)                                                   |
| Marketplace install, one click                    | Real (D-116 marketplaces, Discover)                                  |
| Plugins (code plus AI instructions)               | Announced (`Soon`)                                                   |
| MCP, API, Web, CLI from one definition            | Real                                                                 |
| Company SSO, teams, audit log, secrets per person | Real                                                                 |
| Preview per branch, rollback                      | Real                                                                 |
| Forgeron MCP to develop from Claude               | Real (the admin and developer MCP)                                   |
| Self-managed on your Cloudflare account           | Real (`forgeron platform install`)                                   |
| On your own servers (no Cloudflare)               | Announced (`Soon`), name to find (not "Mini Forge")                  |
| Usage per tool and person                         | Real as a counter (D-093); no screen; per team and AI cost announced |
| AI gateway                                        | Announced (`Soon`)                                                   |
| Personal tokens                                   | Real; application tokens announced (`Soon`)                          |

## Cloudflare figures (sourced)

Read on 17 Nov 2026. Only these figures are used; nothing else about Cloudflare is claimed.

| Figure on the page                 | Source                                                                                                                       |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| 348 cities                         | cloudflare.com/network ("348 cities · 8 regions"; no date on the page)                                                       |
| 95% of Internet users within 50 ms | cloudflare.com/network ("within 50 milliseconds of a Cloudflare data center")                                                |
| No cold starts (V8 isolates)       | cloudflare.com/products/workers ("Zero cold starts with V8 isolates")                                                        |
| No egress fees                     | developers.cloudflare.com/workers/platform/pricing, updated 13 Nov 2026 ("no additional charges for data transfer (egress)") |

Left out on purpose: the network page's own counter says "250ms to 95%", which contradicts its 50 ms line; the Workers page says "330+ cities" against 348. We quote the network page's body text and its city list, and name the source under the figures.

## Sections

Every section opens with the hatched spacer band (`/0.x → Name`), never a big index. Copy is short: a title, one lead line, labelled chunks.

### Opening — the burning village (unchanged)

The ERP's fall stays as the opening. It ends on the hero.

### Hero

- Title: **Forge your internal tools.**
- Lead: Pick a ready-made tool. Shape it to your team with AI. Ship it to your people and your agents.
- Action: `Get started`, and `npx forgeron init`.
- Proof chips: Cloudflare, Apache-2.0, Company SSO.

### /0.1 How it works — Pick. Shape. Ship.

Three steps stacked, each a wide bordered row: a big pixel numeral (`01`, `02`, `03`) on the left with the title, the lead and three one-line chunks; the visual on the right. Inspired by numbered-step layouts with isometric blocks and a single accent block.

1. **Pick — Start from a tool that already works.** "A CRM, a help desk, a notes app: browse finished tools and install one." Visual: a catalog grid of six cards (pixel icon, name, one word), the CRM selected in ember with an `Install` button; help desk, ticketing and notes tagged `Soon`. Chunks: installed in one click · kept up to date by its maintainers · yours to fork.
2. **Shape — Make it fit your team, with AI.** "Ask for a page, a field, a workflow. Plugins hand the AI tested code and the method to add it." Visual: a prompt ("Add a renewal date to deals, and a page of this month's renewals."), the answer as a diff summary, and a column of plugin toggles (Kanban board, Email sync, Odoo bridge, Renewals). Tag `Plugins · Soon`. Chunks: a preview for every change · every change versioned · plugins: code plus instructions.
3. **Ship — Out to your people and your agents.** "One click, and the tool is live on the web, in the terminal, over the API and in Claude, behind your SSO." Visual: two groups of doors, _For your people_ (Web, CLI) and _For your agents_ (MCP, API), each with its isometric door, and the chat line "Move the Durand deal to Won." → `crm.deals.move`. Chunks: one click · same rights on every door · made for the agent era.

### Spacer — Under the hood

### /0.2 Anatomy — One tool, five layers.

The exploded stack (unchanged drawing), with its five labels. Lead: "What the platform stacks under every tool, so your change only touches what makes it yours."

### /0.3 Resources — Everything on tap.

Lead: "A tool lists what it needs; the platform hands it over, one per tool and environment."

**New drawing.** The tool stands in the middle on a plinth; each resource is an object you recognise, wired to the tool by a cable, the active one in ember and its cable carrying packets:

- Database: the classic cylinder, three stacked discs with a lit band.
- Files: a filing cabinet, a drawer sliding out with sheets.
- Cache: a rack of small drawers (key slots), one blinking.
- Queue: a conveyor feeding envelopes into the tool, one after another.
- Secrets: a bank vault, a heavy door with a big turning wheel and bolts.

The "not declared / ghost" slot is removed. Next to the drawing, the five names with one line each. Under it, the `forgeron.config.ts` declaration.

### /0.4 Network — On Cloudflare's network.

Lead: "Every tool runs as its own Worker on Cloudflare's network: close to your teams, nothing to keep running." Visual: the dithered globe, and four figures glued in a bento (348 cities · 50 ms from 95% of Internet users · no cold starts · no egress fees), the source line under them.

### /0.5 Access — Who did what, with which rights.

Three illustrated cards, one isometric drawing each, no mock-ups:

- **Company SSO**: a badge reader at a gate. "Your teams sign in with the identity provider you already use."
- **A vault per person**: a small bank safe with a turning wheel. "Each person keeps their own API keys, sealed by the platform. Nobody reads them back."
- **Audit log**: a ticker printing a paper tape. "Usage, deployments and every change, with who made them."

### /0.6 Develop — From your laptop to everyone.

A pinned production line: a full-width drawing stays on screen while the page scrolls, and a code package travels along it, Local → Preview → Production. Under it, three texts take turns, the current one lit, with the same pixel switch as the opening:

1. **Local**: `forgeron dev` runs the tool on your machine, with local data.
2. **Preview**: every branch gets its own link, to share before it ships.
3. **Production**: a release goes live; `forgeron rollback` takes it back.

Then two panes side by side: **Terminal** (the rolling list of commands) and **Forgeron MCP** ("Develop from Claude: create a tool, run it, preview it, publish it.").

### /0.7 Hosting — Our cloud, or yours.

Three columns like a pricing table, no prices:

- **Forgeron Cloud** (`Recommended`): updates applied for you · security patches applied for you · priority support · one bill, per seat.
- **Self-managed**, on your Cloudflare account: you install and update with the CLI · you provision and patch · you see and own the infrastructure · your data stays in your account.
- **Your own servers** (`Soon`): on a machine or a VPS you run, without Cloudflare · less redundancy, fewer usage features.

Under it, one line on why Cloudflare: redundancy across its network, the figures of /0.4.

### /0.8 Extras — The small extras.

A bento of three:

- **Usage per team**: what each team and tool consumes, resources and AI spend. Visual: pixel bars per team. (AI spend: `Soon`.)
- **One AI gateway** (`Soon`): providers on one side, Forgeron as the single entry, your tools on the other, with who calls what.
- **Agents, at home**: a shared workspace where people and agents use the same tools. Sign in per person (OAuth), personal tokens, application tokens (`Soon`).

### Questions, Start, Footer

FAQ rewritten around the new story (what is a tool, can I change a tool, do I need servers, can I host it, how do agents use it, is it open source). Closing call: **Forge your first tool.**

## Visual rules kept

From `docs/design-taste.md`: the spacer band instead of big indices, glued bordered cells with corner brackets, one ember, black text on ember, pixel switches (no fades), static under `prefers-reduced-motion`, no counters in chrome, short lines.

## Revisions after the first review (17 Nov 2026)

These supersede the matching lines above.

- **No round shapes.** Every drawing is boxes, straight lines and square dots; what turns does it a notch at a time.
- **Ship** groups its doors by who uses them: _For your people_ (Web), _For your agents_ (MCP, CLI), _For your applications_ (API).
- **Shape**: the chat is replaced by a list of **recipes** (`Soon`), styled like the plugins list; the open recipe shows its documents (`RECIPE.md`, schema, action, view, test).
- **Anatomy** is titled "One framework, five layers."
- **Resources** has six objects, clockwise from noon, in the order of the list beside it: database (a server with drive bays), files (a filing cabinet), cache (a memory stick under a pixel lightning bolt), secrets (a safe on feet, framed door, lever and three-spoke handle), queue (a stepped funnel letters drop into, cabled to the tool), observability (a monitor). Hovering from one row to the next never hands back to the cycle in between.
- **Access**: the SSO card is a toll barrier (one big post, one small rest post, a striped arm that swings up) with people walking up and laying a badge; the vault card is "One vault" for application and personal secrets; the audit log is a ledger unrolling, one line at a time.
- **Observe** is a section of its own (/0.6, "See every call."): timing step by step, usage and activity (real), logs and errors on Cloudflare's observability (`Soon`).
- **Develop**: the title, the drawing and the three stops are pinned together, with a rule above and below the stops. The line is a workshop (tool board, workbench, anvil, sparks) → a desk with a cathode-ray monitor drawing the preview → a belt down the avenue of a small town into a depot, with a lattice mast; the three zones share one size, and only our package travels.
- **Hosting**: each plan has an animated drawing on top (a pixel cloud sending updates; a fenced plot with your terminal deploying into it; server racks with their admin).
- **Cards are glued** edge to edge (steps, access, hosting), like the bento: no inner margin.
- **Usage per team** shows compute calls, compute spend (database, cache, files and calls in one unit) and AI spend.

## Second review (17 Nov 2026)

- **Opening burn**: the SVG data-URL mask rebuilt on every scroll (decoded asynchronously, rasterised each time) is replaced by a `clip-path: inset()` and a fringe painted on the ember canvas from two cached Bayer patterns; the embers are batched into one path per colour and the canvas is sized only on resize. Measured in the browser pane: 31.7 ms → 25.4 ms per frame through the burn, against 23.2 ms for the rest of the opening, and no flicker.
- **Mushroom cloud**: about 2.5 times more points, same shape.
- **Order**: How it works, Anatomy, Resources, Access, Observe, Develop, Network, Hosting, Extras — the network sits next to hosting.
- **Hosting**: each plan has a sentence, two titled groups of lines and a button (Get started; Read the install guide, `docs/self-host.md`; Follow on GitHub). The note under the plans is gone.
- **Extras**: the "workspace shared by people and agents" card is removed.
- **Footer**: cells glued edge to edge, links pointing at the new sections.

## Third review (17 Nov 2026)

- **Hero**: the village band is two thirds of the room it used to take; the next section rises under the stage and shows as the burn closes (`--tail`), so nothing gapes; a rule above "Forging at".
- **Resources**: seven objects clockwise from noon (database, files, cache, secrets, queue, cron jobs as a square alarm clock, observability), each with a hand-routed cable; the files drawer steps out and back with its sheets inside; no code block under the section.
- **Access**: the middle card is "Every call, measured", one wide screen with four panels (calls, time per call, errors, logs); the Observe section is removed; "One vault" moves to the extras.
- **Extras**: three cards a row (usage, AI gateway, vault), copy blocks one height; usage shows compute spend (one unit for CPU, storage and crons, no overage per resource) and AI spend.
- **Network** leaves the home page for `/pricing`.
- **Pricing page** (`apps/site/src/pages/pricing.astro`): plans with their price in pixel figures (Forgeron Cloud $14.99 per seat per month, the owner's price; self-managed and own servers $0), six reasons for Forgeron Cloud with a drawing each, the network figures (sources above, plus "13,000+ network interconnections" from cloudflare.com/network), a comparison table, an open-source band and questions. A seat follows D-024. The home page's Hosting section links to it ("See pricing").
- Shared: `SiteNav` component, `data/plans.ts`, plan styles in `site.css`; the footer takes the page's last coordinate.

## Fourth review (17 Nov 2026)

- **Hero**: the close of the opening ends exactly at the end of its scroll (it used to stop at 98 %, leaving a quarter of a screen of dead scroll); a rule below "Forging at" too.
- **How it works**: the three steps stack as the page scrolls, each sticking 112 px lower than the one before so the numbers above stay in view (desktop only).
- **Anatomy**: "One framework, six layers": Interfaces, Access, Tools, Observability, Data, Runtime, with an icon and a number each (01–03 left, 04–06 right), corner ticks. The drawing is compact; hovering a row or the drawing itself spreads the layers above apart and slides the picked one out with its name.
- **Resources**: eight objects, realtime added at eleven o'clock as a small mast with square waves; corner ticks on every row.
- **Develop**: corner ticks on Local, Preview and Production.
- **Hosting (home)**: plan names in the pixel face; Forgeron Cloud's button is "See pricing"; the banner under the plans is gone.
- **Extras**: six cards, three a row: usage, AI gateway, vault, teams and permissions, marketplaces, approval policies.
- **Pricing**: the price sits above the plan's name, and the names are in the pixel face.

## Fifth review (17 Nov 2026)

- **Section heads** are compact: the coordinate and the label on one line, then the title and its lead on the gutter; a dissolve field of particles sits in the bottom right corner (`SectionHead.astro`, `.sec-dither`).
- **How it works**: the stacking on scroll is removed; the steps are glued again.
- **Anatomy**: back to the first stack's look, plates spaced on dashed posts and breathing, with more room between them; each plate carries a flat schematic of its layer (ports, a permission grid, processors, a graph, memory strips, a CPU with pins and traces). Hover still spreads the plates above and names the picked one.
- **Develop**: Terminal and Forgeron MCP share one look, a rolling list in mono; the MCP pane reads as a transcript (what you ask, then the calls it makes); corner ticks on both.
- **Extras** are all iso drawings: usage as rows of cubes with the team names painted flat on the floor, a small village of repositories for marketplaces, a 3D grid of teams × actions with a person at each column for permissions, and for approval policies a tool whose cable ends in a plug that goes into the server's socket once approved, stamped with a check mark.

## Sixth review (2026-11-17)

- Section heads: no particles, no bracketed tag; Pick, Shape and Ship lose their tag too.
- Six layers: icons only, no numbers. Resources: no Cloudflare product names (a sales page).
- Develop: the line runs almost level (stations stepped along the diagonal), a shorter canvas;
  the active station's name turns orange; Terminal and MCP panes removed; the hosting head rides
  in the pin under the stops, so it is in view while the package travels.
- Village: customers are simulated walkers (home, queue, window, a step left, home); the story
  only changes where trips go and how long support takes. Marketing broadcasts small rings.
- Closing call: a forge striking a bar into a tool, beside the command.
- Pricing: name, description (even heights), then price with its unit under it; a savings
  simulator (`data/stack.ts`) with prices read on the vendors' pages on 2026-11-17, sources
  listed under it, logos from Simple Icons 16.36.0.
