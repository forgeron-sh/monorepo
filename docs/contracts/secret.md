# Contract: `secret`

> Status: proposal (21 November 2026). Version `secret@1`. Prefix `SEC`. Mirrors Workers secrets and our own sealed store. See [README](README.md).

## 1. Purpose

Values a tool needs and nobody should read: an upstream's API key, a webhook signing key. A tool declares each name and why; an admin sets the value per environment; the tool reads it on `ctx.secrets`. A value goes in and **never comes out** through any interface, to anyone. Per-person secrets (`resources.userSecrets`, `field.secret`) follow the same rule and are covered here where they meet the provider; their collection, versions and binding (D-036, D-096, D-104, D-105) stay the gateway's.

## 2. Declaration

Today (`packages/manifest/src/schema.ts`, `templates/inventory/forgeron.config.ts`):

```ts
resources: {
  secrets: {
    SHAREPOINT_TOKEN: { why: "Bearer token to read the SharePoint equipment list every night" },
  },
  userSecrets: {
    ODOO_API_KEY: { label: "Odoo API key", help: "…", why: "Read your Odoo tickets", kind: "odoo.api-key" },
  },
}
```

Names are `UPPER_SNAKE` (`SecretNameSchema`). Nothing names a product; it stays. The compiler refuses `ctx.secrets.NAME` for a name the config does not declare (`packages/compiler/src/check.ts`).

## 3. Interface

What a tool sees (unchanged):

```ts
/** `ctx.secrets`: the tool's declared secrets for the channel's environment; read-only. */
type Secrets = Readonly<Record<string, string | undefined>>;
/** `ctx.userSecrets`: the caller's own; a missing one fails the call with `SECRET_REQUIRED` first. */
type UserSecrets = Readonly<Record<string, string | undefined>>;
```

What a provider implements (`@forgeron/contracts`):

```ts
export interface SecretSource {
  /**
   * The values of the declared names for one tool and environment, resolved before a call or a
   * task runs. An unset name is absent. Called by the host, never by tool code.
   */
  read(scope: {
    tool: string;
    environment: "production" | "preview";
    names: readonly string[];
  }): Promise<Readonly<Record<string, string>>>;
}

export interface SecretAdmin {
  /** Sets or replaces a value. Write-only: nothing returns it (SEC-01). */
  set(
    scope: { tool: string; environment: "production" | "preview" },
    name: string,
    value: string,
  ): Promise<void>;
  delete(
    scope: { tool: string; environment: "production" | "preview" },
    name: string,
  ): Promise<void>;
  /** Names only, with when each was set. */
  names(scope: {
    tool: string;
    environment: "production" | "preview";
  }): Promise<{ name: string; updatedAt: Date }[]>;
}
```

`SecretAdmin` is what the platform routes already offer (`apps/gateway/src/platform/secrets.ts`: list names, set, reseal; `forgeron secrets set`, the admin MCP's `secret_request`). `SecretSource` is what is missing.

Where today's code differs:

- **`ctx.secrets` is empty in a deployed tool.** Values are sealed in the registry (`setSecret`, AES-256-GCM, `packages/registry/src/modules/secrets/store.ts`), and `readSecrets(toolId, environment)` decrypts them "for the runtime's `ctx.secrets`". It has no caller outside tests. The gateway forwards per-person secrets (`x-forgeron-user-secrets`) but no tool secret, the Worker entry passes none (`packages/compiler/src/build.ts`), and the runtime's default is `secrets: {}` (`packages/runtime/src/engine.ts`). So `templates/inventory/jobs/sync-sharepoint.ts` throws "The secret SHAREPOINT_TOKEN is not set." on every deployed run.
- **Two environments, not one per channel.** Secrets exist for `production` and `preview`; every channel that is not production, a permanent `staging` included, "is served with the `preview` secrets" (`apps/gateway/src/dispatch/dispatch.ts`). The contract keeps this (SEC-05) and asks whether it should change (open question 3).
- **Size.** The registry takes up to 16 KB per value; a Worker variable or secret binding is at most 5 KB ([Workers limits](https://developers.cloudflare.com/workers/platform/limits/)). If tool secrets become Worker secret bindings, the registry's limit is too high (open question 1).

## 4. Guarantees

| Id     | Guarantee                                                                                                                                                                                                  | Source                                                                                                                                                                                                                                                       | Anvil                                                                                    |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| SEC-01 | **Never readable back.** No platform route, CLI command, MCP tool, console screen or log returns a value once set; the answers carry names.                                                                | Cloudflare: "secret values are not visible within Wrangler or Cloudflare dashboard after you define them" ([secrets](https://developers.cloudflare.com/workers/configuration/secrets/)). Ours: `platform/secrets.ts` ("A value goes in and never comes out") | the same gateway code over its own store                                                 |
| SEC-02 | **Only what is declared.** A call receives only the names its manifest declares; an undeclared name is absent even if a value is stored.                                                                   | ours: the compiler check, and `SecretSource.read({ names })`                                                                                                                                                                                                 | same                                                                                     |
| SEC-03 | **Sealed at rest.** Values are encrypted with a platform key before storage (AES-256-GCM, a slot per tool, environment and name), and can be resealed under a new key (D-108).                             | `packages/registry/src/secret-box.ts`, `reseal.ts`                                                                                                                                                                                                           | same box; the master key in a file readable only by the `anvil` user, or the environment |
| SEC-04 | **Read-only to the tool.** `ctx.secrets` and `ctx.userSecrets` are frozen; a tool cannot set or change a secret.                                                                                           | ours (`Readonly`; to freeze at run time)                                                                                                                                                                                                                     | same                                                                                     |
| SEC-05 | **Per environment.** Production calls and tasks get the `production` values; every other channel gets the `preview` values. A value set for one is never served to the other.                              | ours (`dispatch.ts`, registry `environment` column)                                                                                                                                                                                                          | same                                                                                     |
| SEC-06 | **Fresh per call.** A value set or deleted is used by calls that start after the change is acknowledged, within 60 s.                                                                                      | ours; the gateway's registry cache bounds it (`hot-registry.ts`): the exact bound is **UNVERIFIED**                                                                                                                                                          | read per call from the local store                                                       |
| SEC-07 | **Per-person secrets are the caller's own.** A call gets only its caller's values; a task gets none; nobody else, developer or admin, reads them.                                                          | ours (D-036, `x-forgeron-user-secrets` set by the gateway only)                                                                                                                                                                                              | same                                                                                     |
| SEC-08 | **Isolation between tools.** A tool never receives another tool's secrets, even of the same name; a per-person secret shared between tools (D-105) reaches a tool only through a binding the person chose. | ours (slot per tool)                                                                                                                                                                                                                                         | same                                                                                     |
| SEC-09 | **Not in errors or logs by the platform.** No platform error message, audit entry or log line contains a value.                                                                                            | ours (audit records ids, never values: `secret:bound`)                                                                                                                                                                                                       | same; the dev log redacts any declared value it sees (open question 4)                   |

## 5. Non-guarantees

| Id     | A tool must not rely on                                                                                                                                                                        | Anvil dev chaos                                                                               |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| SEC-N1 | **A secret being set.** A declared secret may have no value (a new install, a new channel, a deleted value). Check and fail with a clear message, as `sync-sharepoint.ts` does.                | leave each declared secret unset in 1 of 3 dev runs, unless `.forgeron/local/secrets` sets it |
| SEC-N2 | **The same value on every channel.** Production and preview differ; a branch has the preview values.                                                                                           | none                                                                                          |
| SEC-N3 | **A value staying the same during a long task.** A change mid-run is seen by the next call, not this one; and a rotated key may stop working upstream before the run ends.                     | none                                                                                          |
| SEC-N4 | **The secret being hidden from the tool's own code.** The tool can send it to any host `resources.network` allows. The contract protects a value from people, not from the tool that holds it. | none                                                                                          |
| SEC-N5 | **A per-person secret existing for a task or another tool's call.** Tasks have none; `ctx.tools.<name>.call` runs with the caller's identity in the target, which uses its own bindings.       | none                                                                                          |
| SEC-N6 | **Secrets as configuration.** A value that is not secret (a site id, a base URL) belongs in the setup fields or the code; secrets cost an approval and cannot be read back to debug.           | none                                                                                          |

## 6. Limits

| Id      | Limit                          | Cloudflare                                                                                                                                       | Contract                                            |
| ------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------- |
| SEC-L01 | Value size                     | 5 KB per variable or secret ([Workers limits](https://developers.cloudflare.com/workers/platform/limits/)); our registry: 16 KB                  | 5 KB (open question 1)                              |
| SEC-L02 | Secrets per tool               | 64 (Free) / 128 (Paid) variables per Worker, all bindings counted ([Workers limits](https://developers.cloudflare.com/workers/platform/limits/)) | 32 tool secrets, 32 per-person secrets              |
| SEC-L03 | Name                           | —                                                                                                                                                | `UPPER_SNAKE`, as `SecretNameSchema`, 64 characters |
| SEC-L04 | Per-person secrets in one call | the gateway sends them in a header; header limits apply: **UNVERIFIED**                                                                          | 16 KB in all for one call                           |

## 7. Errors

| Code                  | Where | When                                                                                                                                                                  |
| --------------------- | ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SECRET_UNDECLARED`   | build | Code reads `ctx.secrets.NAME` or `ctx.userSecrets.NAME` for a name the config does not declare (the compiler's check, given a code).                                  |
| `SECRET_NAME_INVALID` | set   | A name outside SEC-L03.                                                                                                                                               |
| `SECRET_TOO_LARGE`    | set   | A value over SEC-L01, or empty.                                                                                                                                       |
| `SECRET_UNREADABLE`   | call  | A stored value cannot be opened with the current key (a reseal left it `unreadable`, D-108). The call fails with `INTERNAL`; the log names the secret, never a value. |
| `SECRET_REQUIRED`     | call  | A declared per-person secret is missing: the existing `ToolError` (428, with the input link, `sdk.md` §6).                                                            |

Reading an unset tool secret is not an error: it is `undefined` (SEC-N1).

## 8. Conformance

| Case     | Proves      | What it does                                                                                                                              |
| -------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| SEC-01.a | SEC-01      | set a value, then call every platform route, CLI command and MCP tool that lists secrets: the value appears in no response body or header |
| SEC-02.a | SEC-02      | store `A` and `B`, declare only `A`: the call sees `A` only                                                                               |
| SEC-03.a | SEC-03      | the stored row is not the value; a reseal keeps it readable; a wrong key gives `SECRET_UNREADABLE`                                        |
| SEC-04.a | SEC-04      | assigning `ctx.secrets.A` throws or has no effect on the next call                                                                        |
| SEC-05.a | SEC-05      | different values for production and preview: a production call, a `~staging` call and a branch call each see the right one                |
| SEC-06.a | SEC-06      | change a value; a call started 60 s later sees the new one                                                                                |
| SEC-07.a | SEC-07      | person A's value never reaches person B's call or a task                                                                                  |
| SEC-08.a | SEC-08      | tools X and Y both declare `KEY` with different values: each sees its own                                                                 |
| SEC-09.a | SEC-09      | a call that fails with a secret in scope: the error body and the platform log hold no value                                               |
| SEC-L.a  | SEC-L01–L03 | at each limit succeeds; over it fails with the listed code                                                                                |
| SEC-N.a  | SEC-N1      | Anvil dev: a declared, unset secret is `undefined`, not an empty string                                                                   |

## 9. Open questions

1. **How tool secrets reach the Worker.** Two ways: (a) as Worker secret bindings written at each deployment and at each change, which Cloudflare keeps sealed, capped at 5 KB and counted with the other bindings, and which needs a new Worker version on every change; (b) from the registry per call, through a header only the gateway sets, as per-person secrets already do. Recommendation: (b), because it keeps one store and one seal for both kinds, makes SEC-06 immediate, and is what Anvil does; adopt the 5 KB limit anyway so (a) stays possible.
2. **Wiring now.** `ctx.secrets` is `{}` in production, which breaks the inventory template. Recommendation: wire `readSecrets` into the dispatch path before any other part of this contract, with SEC-02.a and SEC-05.a as its acceptance.
3. **One environment per channel?** A permanent `staging` channel shares `preview` secrets with every branch, so a branch's code can read the staging key. Recommendation: keep two environments in `secret@1`, and add per-channel overrides for permanent channels in `secret@2`, falling back to `preview`.
4. **Redaction.** Should the runtime replace a declared secret's value with `***` in `ctx.log` and in an `INTERNAL` error's logged detail? Recommendation: yes, in the runtime, for values over 8 characters; it is cheap and SEC-N4 remains the real boundary.
