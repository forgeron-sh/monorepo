# Forgeron: who we are

The facts a piece may state about Forgeron, each with where it comes from. A claim missing here is checked against its source before it is written, then added here.

## In one line

Forgeron is an open source platform to write, version, host and govern a company's internal tools. A developer describes a tool once with the SDK (its data, its actions, its permissions) and Forgeron serves it through four interfaces: MCP for Claude, API, Web and CLI. Everything runs on Cloudflare Workers.

Source: `README.md`, `docs/white-paper.md`.

## The bet

Teams will work with their business tools through an assistant like Claude first. The heavy interface of a business suite then loses its value; what matters is reliable data and well-defined actions, with the right permissions. Forgeron is that layer, light, on Cloudflare Workers.

Source: `docs/white-paper.md`, Summary. The long form is the manifesto: `apps/site/src/content/blog/manifesto.mdx`.

## Convictions

1. Backend first, interface second.
2. Claude is a desirable interface; views keep their place where a conversation is slower.
3. Light and modular rather than integrated and heavy.
4. One enforced shape for every tool: config, tables, actions, views.

Source: `docs/white-paper.md`, The vision.

## The product

- **SDK**, **CLI**, **runtime**: open source, enough to run a tool.
- **Console**: tools, versions, environments, access by team and by action, SSO, secrets, usage log.
- **Catalog**: ready-to-launch tools (CRM, contact records, data hub, API gateways such as Odoo).
- **Connectors**: Microsoft 365, Google Workspace, Odoo, with delegated authentication.
- One action becomes an MCP tool, an API route, a CLI command and a hook for React views.

Source: `docs/white-paper.md`, The product; `docs/sdk.md` is authoritative for the API.

## Lab projects

The open source building blocks published at `lab.forgeron.sh`: Icons, UI, Forgeron Sans, Shaders, Blueprint, Canvas, Draw, Flow, Rich text, Quill. Each one's status (stable, experimental) and line are in `apps/lab/src/data/projects.ts`: read them there.

## Offer and licence

- Open source under Apache-2.0, except `apps/gateway` and `apps/console` (AGPL-3.0-only). Source: `README.md`, D-085.
- Self-managed: free, on the company's own Cloudflare account; Forgeron has no access to the data.
- Forgeron Cloud: **planned**, not available. When it ships, one price per seat per month; the price and what each plan includes live in `apps/site/src/data/plans.ts`. Until then, write "planned" and never "sign up", "get started" or a price as if it could be bought. Source: interview, 2026-11-20.

## Status

The repository's own status line is in `README.md` (design, November 2026). Released components are versioned in `CHANGELOG.md`; the lab projects carry their own status (stable, experimental).

Check the current state before stating what is available: `CHANGELOG.md` (released versions), `apps/site/src/content/changelog/` (what the site announced), and `docs/DECISIONS.md` (decided, with dates).

## What we never claim

- A customer, a quote or a figure from a customer without their written agreement.
- A benchmark without its method and its date.
- A feature as available when it is planned: write "planned" or leave it out. Forgeron Cloud is planned.
- A comparison that names a competitor's weakness without a public source.
