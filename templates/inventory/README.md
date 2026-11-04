# Equipment inventory

Equipment across sites, fed by CSV imports and a nightly SharePoint synchronization.

## What it does

- Lists the sites and the pieces of equipment, with their type, their attributes, their attachments and the date of their next check.
- Imports a CSV of equipment (a dry run first), and keeps itself in line with a SharePoint list every night.
- Answers from Claude, the API and the command line.

## How to use it

- In Claude: "equipment of one city whose check is due", "attach this PDF to a piece of equipment".
- To import a CSV, run the import in dry-run mode first, read the report, then run it for real.
- Attaching a file stores it and gives a link that works for 15 minutes.

## Permissions

| Role         | May                                              |
| ------------ | ------------------------------------------------ |
| `reader`     | Read sites, equipment and the history of imports |
| `technician` | Read, create and update, attach files            |
| `admin`      | The same, delete, and import a CSV               |

The nightly synchronization needs the `SHAREPOINT_TOKEN` secret, set by an administrator.

## For developers

This is the template `inventory`.

Equipment across sites, fed by CSV imports and a nightly SharePoint synchronization, queryable from Claude and the API.

Specification: [`docs/examples/03-data-hub.md`](../../docs/examples/03-data-hub.md). This folder follows the mandatory shape of a tool (`docs/sdk.md` §2).

| Action                      | Access   | What it does                                                                 |
| --------------------------- | -------- | ---------------------------------------------------------------------------- |
| `sites.list`                | `read`   | Lists sites, optionally of one city                                          |
| `sites.create`              | `write`  | Creates a site, or updates the city of the one with the same name            |
| `equipments.search`         | `read`   | Filters by city, site, type or check date; pages with `limit` and `cursor`   |
| `equipments.get`            | `read`   | One piece of equipment by id or ref, with attributes and attachments         |
| `equipments.import`         | `import` | Imports CSV text, matched on `ref`; `dryRun` (default) only reports          |
| `equipments.attach`         | `write`  | Stores a PDF or image in `ctx.files` and records it (signed URL, 15 minutes) |
| `equipments.set-attributes` | `write`  | Merges free-form attributes (`null` removes a key)                           |
| `sync-runs.list`            | `read`   | Latest imports and synchronizations                                          |

`jobs/sync-sharepoint.ts` runs at 2 am Paris time. It reads the SharePoint list through Microsoft Graph, links rows to their SharePoint item (`external_id`, or the `ref` when not linked yet) and updates `next_check`. `events/sync-history.ts` handles `inventory.synced` and writes one row per import or synchronization into `sync_runs`.

Roles: `technician` read and write, `reader` read only, `admin` also `delete` and the tool-specific `import` level.

### Differences from the example

The SDK does not provide some pieces the example uses; this template stays on what exists today.

- No `z.file()`: the import takes the CSV text (`csv`), the attachment takes `content_base64`.
- No `forgeron/csv` and no `paginate`: `lib/csv.ts` parses the CSV, `equipments.search` pages by hand.
- `t.json()` does not validate with Zod: attributes are checked in `lib/attributes.ts`.
- Connectors are not implemented (Connectors project): the job calls Graph through `ctx.fetch` (`resources.network`) with the secret `SHAREPOINT_TOKEN`. The site and list are those of the example.
- The test platform has no `ctx.files`: the checks that precede storing an attachment are tested, storing itself is not.
- The `ref` to `sku` rename (two-step migration) is not part of this template.

### Tests

```bash
bun run test
```

The SharePoint upstream is simulated with `mockFetch`; no real secret is used.
