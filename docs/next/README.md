# Target architecture

> Status: proposal (21 November 2026). These documents describe what Forgeron is being rebuilt into. They are read before starting any issue of the roadmap. What the code is today stays in [`../ARCHITECTURE.md`](../ARCHITECTURE.md) and [`../sdk.md`](../sdk.md); a part of the target replaces its counterpart there when it is built.

Forgeron is a platform for internal tools: a company picks finished tools from a catalog, shapes them to its teams with AI, and ships them to its people and its agents. All of a company's tools live in one repository, on one engine, with shared access and one bill.

## Read in this order

| Document                                  | Answers                                                                                   |
| ----------------------------------------- | ----------------------------------------------------------------------------------------- |
| [`../reframing.md`](../reframing.md)      | where we are, the decisions taken, the roadmap and its issues, how we work                |
| [`framework.md`](framework.md)            | the repository layout, the definitions, the CLI, the harness for agents                   |
| [`distribution.md`](distribution.md)      | how a catalog tool reaches a workspace: Add, Fork, updates                                |
| [`engine.md`](engine.md)                  | identity, access, bridges, metering, the AI gateway, record services, the shell           |
| [`../contracts/`](../contracts/README.md) | what a tool may ask of a platform, with the guarantees every platform must meet           |
| [`runtime.md`](runtime.md)                | Anvil: what runs the tools outside Cloudflare, and the choice of what executes TypeScript |
| [`libraries.md`](libraries.md)            | which library for which need, and why                                                     |

Studies behind the choices are in [`../spikes/`](../spikes/): `runtime-workerd.md`, `runtime-deno-bun.md`, `runtime-landscape.md`.

## The layers

| Layer     | Is                                     | Lives in                                                                                         |
| --------- | -------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Suite     | the tools we ship                      | `tools/`                                                                                         |
| Design    | what tools are drawn with              | `packages/ui`, `icons`, the editors                                                              |
| Framework | what a tool author and their agent use | `packages/sdk`, `compiler`, `manifest`, `harness`, `apps/cli`                                    |
| Engine    | what coordinates tools                 | `apps/gateway`, `apps/shell`, `packages/registry`, `bridges`, `ai-gateway`, `metering`, `kernel` |
| Contracts | what a tool may ask for                | `packages/contracts`, `conformance`                                                              |
| Platforms | what satisfies the contracts           | `packages/provider-cloudflare`, `provider-anvil`, `hosting`, `crates/anvil*`                     |

Two rules hold the layers apart: a tool and the engine reach a platform only through a contract; and a tool reaches another tool only through a bridge.

## Vocabulary

| Word                 | Means                                                                                           |
| -------------------- | ----------------------------------------------------------------------------------------------- |
| Tool                 | a business application a team uses; a folder with a `forgeron.config.ts`                        |
| Workspace            | a company's installation: its people, teams, tools                                              |
| Workspace repository | the one repository that holds a company's tools                                                 |
| Catalog              | finished tools a workspace can take                                                             |
| Bridge               | a declared connection between tools or with an outside system: a call, an event, a link, a sync |
| Contract             | a resource a tool may ask for, with its interface and guarantees                                |
| Provider             | a platform's implementation of the contracts                                                    |
| Anvil                | our runtime, one binary: `anvil dev` on a laptop, `anvil serve` on a server                     |
| Recipe               | a document an agent follows to make a known change                                              |
| Plugin               | code that contributes to a tool through its declared extension points                           |
| Fuel                 | the one unit in which compute and AI consumption are counted                                    |

Not used: ERP, module, app (for a tool), dashboard (for the shell).
