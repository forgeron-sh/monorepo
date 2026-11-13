# Compatibility between a tool and the platform

A tool and the platform that runs it are released apart. What binds them is a **contract number** (D-136).

## What happens

- `forgeron build` writes `forgeron: { contract, sdk }` in the manifest: the contract of the SDK the tool resolved.
- Whatever takes a build (`POST /deploy` from CI, a marketplace, a rollback, an update of a channel) reads that number first.
  - **Ahead** of the platform: refused ("built for contract 3, newer than this platform's 2: update the platform, or build with `@forgeron/sdk` `>=0.4.0`").
  - **Removed**: refused, with the SDK to move to.
  - **Deprecated**: accepted, with a warning and its sunset date.
  - No stamp: contract 1.

## The register

`CONTRACTS` in `packages/manifest/src/compat.ts`: one line per contract.

| Contract | SDK       | Status    | Brought                                                                                 |
| -------- | --------- | --------- | --------------------------------------------------------------------------------------- |
| 1        | `<0.4.0`  | supported | builds made before the contract was stamped                                             |
| 2        | `>=0.4.0` | supported | `ctx.directory`, teams, member pictures, pages in production, realtime (D-130 to D-135) |

The SDK column is the range to give to someone who must change it; check it against the release when a contract is added.

## Changing it

- **Add a contract** (append a line, `CURRENT_CONTRACT` follows) when a platform of the previous contract could not read the new manifest, or the runtime offers something a tool built for the new contract relies on: a new key, a new kind of resource, a new header a tool reads. Not for a bug fix or an addition no tool depends on.
- **Deprecate** the previous one when the new one ships and a tool can move: `status: "deprecated"`, a `sunset` date. At least one minor release must pass before it is removed.
- **Remove** it: `status: "removed"`, `removedIn`. Its builds are refused, recorded ones included (a rollback to one is refused too).
- Never delete a line or renumber: an old build must still be told why it is refused.

## Prior art

The same three jobs, in the systems people already know: the tool says what it was made for (`engines.vscode` in an extension, `minAppVersion` in an Obsidian plugin, `required_version` in Terraform); the host keeps a register of what it still accepts (the deprecation policy of Kubernetes: alpha, beta, stable, with a notice before removal); and the refusal comes early and says what to do (VS Code does not offer an incompatible extension; Obsidian reads `versions.json` to find the newest release that still fits).
