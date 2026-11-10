# Spike: a registry of a person's secrets, reusable across tools and branches

Requested by the owner on 2026-11-09, after D-103 (the stored model stays). Documentation only: nothing was
coded or run. Labels: **Fact** (read in the code or a decision), **Deduction**, **Hypothesis**.

## Verdict

1. **Possible, and the surface to change is small.** Fact: per-person secrets are read and written through four
   registry methods (`setUserSecret`, `readUserSecrets`, `userSecretHolders`, `revokeUserSecrets`) used in three
   places of the gateway (the setup page's store, `forwardIdentity`, the OAuth step's completeness check) and
   the admin revocation routes. The tool's code (`ctx.userSecrets.NAME`) and the runtime do not change.
2. **A clean model is three things, not one**: a **secret** (a stable identity), its **versions** (immutable
   values, numbered), and **bindings** (which tool field, in which scope, uses which secret and which version).
   Two different values under the same identity are two versions; two contexts use different ones by binding.
3. **A secret is never reused without the person's click.** A tool that newly asks for a secret is _offered_
   the person's saved ones on its setup page; nothing is bound silently, or any approved tool could harvest
   the keys the person gave to another.
4. **Secrets and plain config are told apart**: only secrets go in the registry. A person's plain values
   (first name, team) stay per tool (D-097).
5. **Admin sets a person's secret, with an audit line the person can see** (the owner's answer on 2026-11-09).
   An admin still does not read a value (D-103 point 2 stays open and is not needed here).

## What exists (facts)

- `user_secrets(tool_id, person, name, iv, ciphertext, updated_at)`: one row per tool, person and field name,
  sealed under `SECRETS_KEY`; the additional data is `user/<toolId>/<person>/<name>` (D-036). Nothing links two
  tools' values, and nothing records a history.
- The setup is per tool, **never per environment** (FOR-174, D-097). A preview of a tool reads the same values
  as production.
- A removed member's secrets and plain values are deleted with them (D-097). The admin can list names and clear
  (D-036). Nobody can read a value back.
- `SECRETS_KEY_PREVIOUS` opens values sealed under an older key; re-sealing is not done (D-100).

## The model

```text
person_secrets            (the registry: one row per secret of a person)
  id            "sec_<random>"      the stable identity the owner calls the succession id
  workspace, person
  label         "Odoo, my key"      given by the person; shown everywhere
  kind          "odoo.api-key"      optional: what the value is, for suggestions (see below)
  created_at, archived_at

person_secret_versions    (immutable: a rotation adds a row, never edits one)
  secret_id, version    1, 2, 3…
  iv, ciphertext, aad   the sealed value and the additional data it was sealed with
  created_at, created_by  the person, or an administrator's id
  via                   "setup" | "my-secrets" | "admin"

secret_bindings           (who uses which secret, where)
  tool_id, field        "ODOO_API_KEY"
  scope                 "*" | "production" | "preview" | "preview:<branch>"
  secret_id, pin        a version number, or null for "the latest"
```

**Resolution at a call (deduction).** For the tool, field, and the environment the call is served from, take the
most specific binding: `preview:<branch>`, then `preview`, then `production`, then `*`. The version is its `pin`,
or the latest of the secret. Then open that version and put the value in the same header as today. A tool with
no binding for a required field answers `428`, as now.

**Why the three-part shape**

- _Same identity, different values_ (the owner's "same succession id"): versions. A rotation is a new version;
  the old one stays until the person or an admin removes it, so a binding **pinned** to it keeps working
  (a preview that must keep using the previous key while production moves on).
- _Reusable_: several bindings point at one `secret_id`. Changing the secret once (a new version) changes what
  every binding on "latest" uses, and the page shows which ones those are.
- _Per tool and branch_: the binding's scope. By default one binding with scope `*` serves the whole tool, as
  today; a person who wants a different Odoo for one branch binds that branch to another secret or to a pinned
  version. This **amends decision 5 of the setup spike** ("never per environment"): the default is unchanged,
  an override is allowed.
- **Existing rows convert without re-sealing** (deduction): a version stores its own `aad`. The migration
  copies each `user_secrets` row into a secret, version 1 and a `*` binding with `aad = 'user/<tool>/<person>/<name>'`
  in SQL, and the value still opens. No key is needed at migration time, which a D1 migration does not have.

## Offering a saved secret at setup

- A secret field may declare a `kind` (`field.secret({ …, kind: "odoo.api-key" })`), a name tools agree on, like
  a connector's type. On the setup page, the person is shown, for each secret field, **their saved secrets of the
  same `kind`** ("Use my saved Odoo key" with the label and the tools that already use it), plus "Use another
  saved secret" (all of theirs) and "Enter a new one".
- Without a `kind`, nothing is suggested by name: a field called `ODOO_API_KEY` in two tools is not proof that
  it is the same thing (**Deduction**; a name match would be easy to get wrong in both directions).
- Choosing a saved secret creates a **binding**, one click, audited (`secret:bound`, names and ids, never a
  value). The admin's approval of the tool's request for a secret (D-096) is unchanged and comes first.
- The check of the setup (D-101) runs on the chosen value, so a saved key that stopped working is caught.

## The person's page, "My secrets"

At the workspace origin, one page for the signed-in person (a gateway page like the setup page, the same
CSP, no script), listing for each secret: its label, kind, how many versions, last changed and by whom (**the
person, or "an administrator" with the date**), and **which tools, fields and scopes use it**. The person can:
rename; **add a version** (replace the key once for every binding on "latest"); change a binding (another
secret, or pin a version); remove a binding; delete a secret (refused while bound unless they confirm that the
tools will ask again); add a new secret not tied to a tool yet.

- **The value is never shown, not even to its owner**: "set", the label, the last 4 characters are **not**
  stored in clear and so not shown. If the person forgot it, they replace it. (Decision b below.)
- It is the one place to change a key; the setup page and the OAuth step link to it.

## Administrator sets a person's secret, with audit

- An administrator can add a version to a person's secret, or create one for a tool field, from the tool's page
  of the console or the admin MCP. The version has `created_by` = the admin and `via = "admin"`.
- **The audit line** (kind `access`, subject `secret:set-by-admin`, the admin, the person, the secret id and the
  field names, never a value) is written in the same batch, and **the person sees it** in "My secrets" as "set by
  an administrator on <date>". If mail is configured the person is also told (decision d).
- **Why this needs care**: Odoo then attributes the actions to the person, who did not give that key. This is
  why the line is visible to the person and why it is not silent.
- An administrator **sees**: the secret's label and kind, versions and dates, who changed it, which tools use
  it, for each person. Never a value.

## What changes in the code (deduction)

| Place                                           | Change                                                                                                                                                                     |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/registry` secrets module              | three tables (migration), the four methods rewritten behind the same names plus new ones for bindings and versions; the legacy table kept until a later migration drops it |
| `forwardIdentity`, the OAuth completeness check | `readUserSecrets(toolId, person, environment)` resolves through bindings                                                                                                   |
| Setup page store                                | "choose a saved secret" and "enter a new one" create a binding or a version                                                                                                |
| New gateway page                                | "My secrets"                                                                                                                                                               |
| Admin routes                                    | list now returns secrets with usage; clear = unbind or delete; new route to add a version for a person                                                                     |
| Runtime, SDK, tool code                         | **nothing**: `ctx.userSecrets.NAME` and the header are unchanged                                                                                                           |
| Rotation of `SECRETS_KEY`                       | one table of versions makes **re-sealing** a single loop (the missing piece of D-100)                                                                                      |

## Proposed tickets (not created)

1. **The model**: three tables, the conversion of `user_secrets` without re-sealing, resolution by scope, the
   four methods behind their names, deletion with the member; all existing tests keep passing.
2. **`kind` and the offer**: the manifest field, the setup page's three choices, the bound audit line.
3. **"My secrets"** page: list, usage, add a version, rebind, pin, delete.
4. **Administrator sets a secret**: the route, the audit line, the person's view of it. Done (D-107); no MCP tool, a secret must not pass through a model.
5. **Branch and environment scopes**: the override on the page and in resolution. Done (D-109).
6. **Re-sealing** of every version under the current key. Done (D-108), and for the other sealed values too.
7. **Drop `user_secrets`** after one release.

Tickets 1 to 3 are the core; 4 follows from the owner's answer; 5 and 6 can wait.

## Decisions for the owner

a. **Matching by a declared `kind`**, never by field name. Recommended.
b. **Can a person reveal their own value?** Recommended: no; they replace it. Revealing means keeping it
retrievable by any code path that serves the page, which is the property D-036 removed. If yes: after a
fresh sign-in, for a few seconds, audited.
c. **Scope**: one binding per tool by default, override per branch optional. Recommended.
d. **Tell the person when an administrator sets or replaces their secret?** Recommended: yes, in "My secrets"
always, and by mail when mail is on.
e. **Plain config stays per tool, outside the registry.** Recommended.

## Risks

- **Blast radius of a shared key** grows with the number of tools bound to it: a hostile tool receives a key
  that also opens another system. The click per tool, the admin's approval and the audit line are the controls;
  the page showing "used by" makes it visible.
- **Pins accumulate**: a version kept for a pinned binding is a key nobody rotates. The page shows pinned
  versions and their age.
- **The registry is one more thing to explain** to a person. "My secrets" must say in one sentence what it is.
- **A per-branch binding on a branch that no longer exists** stays until cleaned: listed on the page, removable.

## Not tested

Nothing was run. The conversion without re-sealing was reasoned from the code (the slot is only the additional
data) and not tried on a real D1. How many secrets a person has, and whether a person understands "version",
is not known.
