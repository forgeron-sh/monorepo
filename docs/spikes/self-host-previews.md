# Spike FOR-20: how do self-host previews work without redeploying the gateway per branch?

Project "Gateway and self-host", label Spike, milestone "Risks retired". Written 2026-11-06.
Documentation only: nothing was deployed, no Cloudflare credential and no real environment was used.
Everything about the real install is for the parent session's checks (see "Not tested").

## Verdict

1. **The ticket's premise no longer matches the code.** FOR-20 and the "Open decisions" row of
   `docs/ARCHITECTURE.md` ask how previews are reached "without redeploying the gateway for each
   branch". Previews are already reached by the same mechanism as every other tool: one service binding
   `TOOL_<WORKER>` per Worker, and **the gateway is redeployed for each new branch** (once when the
   branch's Worker is first activated, once when it is torn down: D-029, D-032, read in the code). The
   ticket's question was settled by implementing the thing it called unacceptable; D-009's "Still open"
   line, the ARCHITECTURE row and D-045's "Not verified" note are stale (details in "Inconsistencies").
2. **Keep that mechanism. None of the leads in the ticket beats it.** Per-version URLs and Cloudflare's own
   Previews (new, September 2026) both put the preview on a public `workers.dev` or custom-domain address
   and cannot be a service-binding target of the gateway. HTTP access with an internal token breaks the
   rule that only the gateway reaches a tool (D-036, D-017). Workers for Platforms is the cloud mode
   (D-009). The "number of bindings" worry is a non-issue in practice: the account's 500-Worker limit is
   reached long before any binding limit (see "Limits").
3. **What is really open is not the redeploy, it is four weaknesses around it**, in this order:
   - **Concurrent first deploys lose a binding, and the repository's own workflow causes them.**
     `templates-preview.yml` deploys four templates in parallel on every pull request. By the code's own
     reading (deduction, not tested), the last gateway version activated drops the others' bindings;
     those previews answer 502 until their tool is deployed again. D-029 and D-032 flagged the race and
     left it.
   - **Teardown has one trigger and no safety net.** A preview is removed only when CI calls
     `DELETE /deploy` on a closed pull request. A branch deleted without that call, a workflow that did not
     run, or a repository that never wired the `close` input leaves a Worker for ever. With a cap of 500
     Workers per account shared with everything else in the account, this is the real capacity risk.
   - **Each bind and unbind is a gateway version.** Cloudflare keeps the 100 most recent versions for
     deployment and rollback, so about 50 preview lifecycles push every earlier gateway version out of
     reach, and an older version may bind Workers that no longer exist.
   - **Nothing measures the cost of a bind** (a full gateway upload, with the console assets, per branch and
     per tool). Not measured here; the parent session can.
4. **Proposed work: five tickets, written below, not created.** The conclusion is recorded as D-080.

## Question

FOR-20 (read 2026-11-06, status In Progress, blocks FOR-24): "In self-host, the gateway reaches a tool
through a service binding that is added by redeploying the gateway, which is acceptable when a tool is
created or deleted but not for every branch. How do previews get reached?" Leads: a per-version preview
URL (to be verified), or HTTP access with an internal token. "How we will know": a proof of concept that
creates and tears down a preview for a branch on a standard Cloudflare account **without touching the
gateway**, and the Cloudflare documentation cited with its date.

This report answers it in two parts: what the repository already answers (so the ticket can be closed on
that point), and what stays open and what to do about it.

## Method

Read the code, the decisions and the docs, then read Cloudflare's documentation. No prototype: the ticket's
proof of concept is not needed once the question is answered by the existing implementation, and the
real-account checks are the parent session's.

Labels used below: **fact** (read in the repository or in a dated Cloudflare page), **deduction** (follows
from facts, not run), **hypothesis** (plausible, nothing read or run says so).

Read in the repository (commit `90c4143`, branch merged with `origin/main` on 2026-11-06):

- `packages/hosting/src/self-host/index.ts`, `gateway-bindings.ts`, `names.ts`, `gateway-bindings.test.ts`
- `apps/gateway/src/dispatch/dispatch.ts`, `targets.ts`; `apps/gateway/src/env.ts` (`gatewayBindingsOf`)
- `packages/registry/src/deploy.ts` (`closePreview`)
- `.github/workflows/templates-preview.yml`
- `docs/self-host.md`, `docs/ARCHITECTURE.md` ("Hosting modes", "Open decisions", "Cleanup"),
  `docs/sdk.md` §7
- D-009, D-017, D-029, D-032, D-036, D-038, D-045, D-052, D-055 in `docs/DECISIONS.md`

Read in Cloudflare's documentation (2026-11-06, through the documentation search and the pages' Markdown
versions; "last updated" is the date printed on each page):

| Page                                                                                         | Last updated        | Used for                                                |
| -------------------------------------------------------------------------------------------- | ------------------- | ------------------------------------------------------- |
| `workers/platform/limits`                                                                    | 2026-10-29          | 500 Workers per account, 128 variables, no binding cap  |
| `d1/platform/limits` (footnote 2)                                                            | not printed         | 1 MB of script metadata, ~150 bytes per binding         |
| `workers/runtime-apis/bindings/service-bindings`                                             | not printed         | deployment order, 32 invocations per request            |
| `workers/versions-and-deployments/deployment-management`, `rollbacks`                        | not printed         | 100 most recent versions; rollback conditions           |
| `workers/versions-and-deployments/version-urls`                                              | 2026-09-22          | Version URL limits and limitations                      |
| `workers/previews`, `previews/resources`, `previews/compare-workflows`, changelog 2026-09-22 | 2026-09-22 to 09-24 | Cloudflare Previews, limits, service-binding limitation |
| `workers/observability/errors`                                                               | not printed         | error 10035 (concurrent modification), 10037, 10057     |
| `fundamentals/api/reference/limits`                                                          | 2026-08-25          | 1,200 API requests per 5 minutes per token              |
| changelog 2025-01-27 (KV namespaces)                                                         | 2025-01-27          | 1,000 KV namespaces per account (old, see "Limits")     |

## What is already answered

**Fact, from the code:**

| Point                                                     | Where                                   | What it does                                                                                                                                     |
| --------------------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| A preview is a Worker of its own                          | `names.ts`                              | `<workspace>--<tool>--preview-<branch slug>-<6-hex hash>`, cut to 63 characters keeping the hash                                                 |
| It has its own resources                                  | `self-host/index.ts` `provision`, D-010 | D1, KV and R2 created per Worker name                                                                                                            |
| The gateway reaches it by a service binding               | `targets.ts`, `names.ts`                | `TOOL_<WORKER>`, name derived one to one from the Worker's name (D-017)                                                                          |
| The binding is added on `activate`, for every environment | `self-host/index.ts` `activate`         | `options.gateway?.bind(worker)`, no branch for `preview`                                                                                         |
| It is removed before the Worker is deleted                | `self-host/index.ts` `teardown`         | `unbind` first (a binding to a missing Worker cannot be deployed), then `DELETE`, then resources                                                 |
| A bind is a new gateway version                           | `gateway-bindings.ts` `redeploy`        | upload version (code from the platform D1, console assets uploaded again, every existing binding as `inherit`) then `POST …/deployments` at 100% |
| A second deploy of the same branch redeploys nothing      | `bind`                                  | `names.includes(name)` returns `false` without upload                                                                                            |
| The address carries the branch                            | `dispatch.ts`, FOR-131 (#142)           | `/t/<tool>@<branch>`, branch matched against `entry.previews`                                                                                    |
| Who may open it                                           | `dispatch.ts` `canPreview`              | fails closed without the hook; the matrix of D-043 and the admin/developer roles decide                                                          |
| A preview is closed from CI                               | D-038, D-045                            | `DELETE /deploy {branch}` → `closePreview` → `teardown` + registry removal                                                                       |

**Deduction:** the gateway is redeployed twice per branch and tool (first activation, teardown), and zero
times for the next pushes to the same branch. So the cost the ticket worried about is bounded by the
number of branch × tool lifecycles, not by the number of pushes.

**Answer to "how do self-host previews get reached"**: through the gateway, at `/t/<tool>@<branch>`, over
a service binding that the gateway adds to itself when the preview's Worker first serves. That is what the
real install does according to the parent session's brief. This report did not re-observe it.

## Existing proof

Fact, reported by the parent session (not re-run here): on 2026-11-04 `/t/crm@fabriks-test-2` on
demo.fabriks.cc answered, and MCP `tools/list` returned 200. This is the proof of concept FOR-20 asks for,
with one difference: it was made through the gateway's redeploy, not "without touching the gateway". It
shows that a preview Worker is bound and served at `/t/<tool>@<branch>`. It does not show concurrent
deploys, teardown, the cost of a bind, behaviour near 500 Workers, or a rollback after many binds.

## What Cloudflare offers instead, and why none fits

All of it fact, from the pages above, unless marked.

**Version URLs** (`<version-prefix>-<worker>.<subdomain>.workers.dev`, last updated 2026-09-22):
public when enabled (Access can protect them); use the Worker's existing configuration and resources, so
no separate database per branch (the page and "Compare workflows" both say so); not generated for Workers
with Durable Objects, nor for Workers for Platforms user Workers; only on `workers.dev`; logs are not
available in Workers Logs, `wrangler tail` or Logpush. Cloudflare's own comparison page tells users not to
use them for branch testing. Fails the isolation that D-010 relies on.

**Cloudflare Previews** (`wrangler preview`, announced 2026-09-22, pages 2026-09-22 to 09-24): a branch gets
an isolated copy under the same Worker, with its own variables, secrets and bindings, 500 Previews per
Worker on paid plans, and deletion of the least recently deployed one when the limit is reached. The
decisive limitation, quoted by two pages: **a service binding from a Preview calls the bound Worker's
production deployment**, "it does not automatically bind to a matching Preview". Read the other way: the
gateway's binding to a tool Worker cannot be made to select a given Preview of it. A Preview is reachable
by its public URL only. Also: the pages describe Wrangler and the Workers Builds API; **no REST endpoint to
create a Preview from the gateway was found** (hypothesis that none exists is not asserted; not found is
all that is known).

**HTTP access with an internal token**: a tool Worker on a public address that the gateway calls with a
secret. Fact: D-036 trusts a header on the tool Worker "because only the gateway reaches a tool Worker
(D-017) and the dispatcher drops what callers send". A public address removes that premise: every tool
would have to verify a token, in runtime code, for every request, in self-host only. Deduction: this
changes the trust model of D-017 for a saving that the numbers below do not call for. Hypothesis, not
checked: a Worker's `fetch` to another Worker's `workers.dev` address on the same account may not behave
like a service binding (the limits page says global `fetch` to a Worker on the same zone fails and points
to bindings or custom domains).

**Workers for Platforms** (dispatch namespace): the cloud mode (D-017, D-009); a purchase for the customer.
Out of scope for self-host by D-009.

## Limits

The ticket and `docs/self-host.md` mention "binding limits". What the documentation says:

| Limit                                     | Value                                                                        | Source and date                                 | Consequence                                                                                                                                                                                 |
| ----------------------------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Workers per account                       | 100 free, **500 paid**; "use Workers for Platforms" above                    | `workers/platform/limits`, 2026-10-29           | the binding constraint: gateway + one Worker per tool and environment + one per open branch and tool, **in an account shared with the customer's other Workers**. Error 10037 when exceeded |
| Variables per Worker (secrets + text)     | 128 paid                                                                     | same page                                       | the gateway holds a handful of keys; service bindings are not listed as variables (hypothesis, not checked)                                                                                 |
| Script metadata                           | 1 MB; ~150 bytes per resource binding; "approximately 5,000" bindings for D1 | `d1/platform/limits`, footnote 2                | the only published binding figure found, written on the D1 page; **no number is published for service bindings**                                                                            |
| Service binding calls                     | 32 Worker invocations per request                                            | `service-bindings`                              | irrelevant here (gateway → tool is one hop)                                                                                                                                                 |
| Versions kept for deployment and rollback | last 100                                                                     | `deployment-management`, `rollbacks`            | see "Gateway versions" below                                                                                                                                                                |
| API requests                              | 1,200 per 5 minutes per user or account token                                | `fundamentals/api/reference/limits`, 2026-08-25 | a bind costs several calls; see "Cost of a bind"                                                                                                                                            |
| KV namespaces per account                 | 1,000                                                                        | changelog 2025-01-27 (old, to re-read)          | one per previewed tool that declares a KV                                                                                                                                                   |

**Deduction on "the number of bindings":** the gateway holds at most one binding per Worker of the account,
so at most 499. Even at the D1 page's 150 bytes it is far below 1 MB (about 75 KB), and far below 5,000.
The binding count cannot be the first limit hit; the 500-Worker cap is. FOR-20's "binding limit of a Worker
version" can be closed as "not a constraint, by a factor of ten". The figure for a service binding is not
documented, so this rests on the Worker cap, not on a published binding cap.

**Capacity, as arithmetic** (deduction): with `T` tools and `B` open branches that deployed each tool, the
account holds `1 + T + T·B` Workers of Forgeron at least. With T = 20 tools and 10 open branches each,
that is 221; with T = 50 and B = 8 it is 451. The platform also needs room for the customer's other Workers.
A leaked preview costs one slot.

## The four weaknesses

### 1. Two previews deployed at the same moment lose a binding

**Fact:** D-029 (not done 2) and D-032 (not done) say it; `docs/self-host.md` ("Binding limits") tells the
user to "deploy the tool again". `bind` reads the binding names from the running isolate's `env`
(`gatewayBindingsOf`: `Object.keys(env)`), uploads a version that lists those names as `inherit` plus its
own, then deploys it at 100%.

**Fact:** `.github/workflows/templates-preview.yml` runs a matrix of four templates (crm, dashboard,
inventory, odoo-gateway), `fail-fast: false`, no `max-parallel`, each calling `POST /deploy` with its own
token. On the first push of a branch these are four first deployments at once.

**Deduction:** each of the four requests starts from an `env` that lacks the other three bindings, so each
uploads `names + own`. Whichever deployment is activated last wins, and its version does not list the
bindings the earlier ones added. Up to three of the four previews stop being reachable (502 "The tool is
not reachable", `targets.ts`), and the tool deploy that lost still reported success. Nothing here retries.

**Not known:** whether Cloudflare rejects some of these with error 10035 ("Multiple attempts to modify a
resource at the same time", listed on `workers/observability/errors`) rather than accepting them silently.
That would turn silent loss into a visible failure; the documentation says what the error means, not when
the versions or deployments endpoints raise it. `FakeCloudflare` does not model either case.

**Not caused only by CI:** a developer deploying two tools from a terminal, or two developers, do the same.

### 2. Teardown has one trigger

**Fact:** `closePreview` is called by `DELETE /deploy`, reached by `forgeron preview close` (D-038, D-045),
which only the template workflow and an adopter's own `close` input call. `ARCHITECTURE.md` ("Cleanup")
calls it "essential in self-host (500 Workers per account)". There is no scheduled sweep, no age or
last-activity field used for it, and no listing in the console of previews that no branch still owns (the
Versions tab of FOR-50 lists previews, but nothing removes them).

**Fact:** D-045: without the workspace variable or the template's secret the close job does not run, "nothing
fails for that".

**Fact:** an interrupted teardown can be repeated: `closePreview` is idempotent (`DELETE` 404 is accepted,
`unbind` of an unbound Worker uploads nothing, D-038).

**Deduction:** previews leak when a branch is deleted without a pull request event reaching CI, when the
workflow does not run, when the token was revoked, and for any adopter that did not copy the close step.
Each leak costs a Worker (of 500), a D1, and possibly a KV and an R2 bucket, until someone finds it.

**Where Cloudflare helps:** nowhere for classic Workers. The automatic eviction of the least recently
deployed Preview exists only for Cloudflare Previews (500 per Worker), not for Workers created through the
Workers API, which refuse with 10037 instead.

### 3. Gateway versions

**Fact:** only the last 100 uploaded versions can be deployed or rolled back to (`deployment-management`,
`rollbacks`, undated). Each bind and unbind uploads one gateway version (`redeploy`).

**Deduction:** about 50 preview lifecycles (bind + unbind) push the older gateway versions out; a bad
gateway version found after that cannot be rolled back to the one before the churn. Also, a version taken
from the window can bind Workers that have since been deleted, and a service binding to a missing Worker
"cannot be deployed" (D-029, from the same documentation). **Hypothesis:** such a version would fail to
deploy; the rollback page only names KV, R2, queues and Durable Object classes as blockers.

**Related, known:** `platform install` re-run derives the bindings from the registry (D-032); a preview the
registry still lists but whose Worker is gone fails with 10057 and is dropped and named.

### 4. Cost of a bind

**Fact:** each bind uploads the gateway's `worker.js` read from the platform D1, in chunks, and the console
assets again (`keep_assets` is refused, D-052), then creates a version and a deployment: at least the assets
session, the version and the deployment, so at least three API calls and a read of the D1 rows, inside a
`POST /deploy` request. D-052 itself says the size of a real console in D1 was not tried.

**Not measured:** time per bind, bytes, and the effect on the CI step. At 1,200 calls per five minutes per
token, three to five calls per bind allows hundreds of binds in that window, so the rate limit is not the
issue for a team; the shared token with other API activity of the same account is (hypothesis).

## Inconsistencies found

1. **Ticket, ARCHITECTURE and D-009 vs. code.** FOR-20, the "Open decisions" row (step 5) and D-009's
   "Still open" all say the question is unresolved and that a redeploy per branch is unacceptable; D-029,
   D-032 and the code do exactly that for previews and call it done (D-029 "Applied in FOR-119"). One of
   them has to give: this report proposes updating the three texts (ticket 1 below).
2. **D-045 "Not verified"** says the address "does not carry `@<branch>` yet". FOR-131 (#142, merged) fixed
   that: `dispatch.ts` reads `/t/<tool>@<branch>` and `tool-address.ts` builds it.
3. **D-017 names** the Worker `<workspace>--<tool>--production|pilot|pr-<n>`. `names.ts` builds
   `…--production` and `…--preview-<branch>-<hash>`; the pilot is gone (D-055) and previews are named after
   the branch, not the pull request. The binding-name rule in D-017 still holds.
4. **`ARCHITECTURE.md` "Hosting modes"** says the gateway is redeployed "when a tool is created or deleted";
   previews are also tools' Workers, so it is also redeployed for each branch. The sentence is right and
   incomplete, and is the source of the ticket's premise.
5. **D-029 vs. D-032 on the race.** D-029 says "the other one's deployment fails or is retried, and a retry
   binds again"; D-032 and `self-host.md` say a binding is lost and the tool must be deployed again. These
   describe two behaviours; the code reads as the second, and nothing tests either.
6. **`self-host.md` "Binding limits"** speaks of a limit; no binding limit is documented by Cloudflare for
   service bindings, and the limit that bites is the Worker count. The wording invites the wrong worry.
7. **D-029 "Not done 3"** says no `version_id` is sent, so `inherit` copies from the most recently uploaded
   version; D-032 relies on "uploads and deploys together". A concurrent upload from another request (point 1
   above) is exactly the case that makes that assumption false, so the two weaknesses are one.
8. **Linear.** FOR-20's own outcome boxes ("Conclusion written here", "Decision recorded in
   `docs/DECISIONS.md`") are unchecked while the work they ask for is partly implemented and recorded
   (D-029, D-032, D-038, D-045).

## Recommendation

Close the ticket's question as answered (a redeploy per branch is the design; it is bounded and idempotent),
update the three stale texts, and fund the four weaknesses in this order. Do not pursue per-version URLs,
Cloudflare Previews or a token over HTTP for the gateway→tool path; revisit Cloudflare Previews only if
Cloudflare lets a service binding select a Preview (watch the "Limitations" section of the Previews
resources page, last updated 2026-09-22).

## Proposed tickets (not created)

1. **Close FOR-20 and fix the stale texts** (docs only, small). Update the ticket's conclusion, the
   "Open decisions" row, D-009's "Still open", D-045's "Not verified", the sentence in "Hosting modes", and
   `self-host.md`'s "Binding limits" wording (say "Worker count" and the race). Record one decision: "a
   preview is reached by a service binding added when its Worker first serves; no per-version URL, no
   Cloudflare Preview, no HTTP token", citing this report.
2. **Serialize gateway self-redeploys** (high). Make `bind` and `unbind` safe under concurrency: re-read the
   current bindings from Cloudflare just before upload instead of from the isolate's `env`, serialize the
   upload-and-deploy in one place (a Durable Object lock or a D1 lease row), retry on 10035, and fail the
   tool's deploy (not report success) if after activation the binding is absent. Add the two-deploys case
   to `FakeCloudflare` and a test; first step is a real two-deploy check on a throwaway account to see
   whether Cloudflare answers 10035 or accepts silently. Interim, no code: set `max-parallel: 1` in
   `templates-preview.yml` and say so in `self-host.md`.
3. **Sweep stale previews** (high). A scheduled handler on the gateway (or a CLI command run from CI on a
   schedule) lists the registry's preview environments, removes those with no deployment for N days
   (default to decide, configurable per workspace), through `closePreview`; the console shows "last
   deployed" and a "stale" mark; an audit line per removal. Add the same to the deploy action's docs as
   "also run `forgeron preview close` on `delete` events". Needs a decision on the default age and on
   whether a preview with an open pull request may be removed (the gateway does not know the repository).
4. **Show the account's Worker budget** (medium). In `platform` status and in the console, count the
   Workers the platform owns against the paid plan's 500 (read from the Workers list endpoint, not
   hard-coded), warn above a threshold (for example 80%), and make a `10037` from `provision` a readable
   refusal that names the sweep and the budget. Also re-read KV and R2 account limits (the KV figure here
   is from 2025).
5. **Keep a known-good gateway version reachable** (medium). Before a bind or unbind, tag or record the
   current gateway version id in the platform D1 as `last_stable`; do not rely on Cloudflare's 100-version
   window for rollback; check that an old version binding a deleted Worker deploys or fails clearly (a
   one-off test on a throwaway account). Alternative if the test shows it is a non-issue: close as not
   needed and record the result.

Not proposed: a per-branch gateway, a pool of pre-bound "slot" Workers (a fixed set of bindings the gateway
keeps, each slot loaded with a branch's code). The slot idea removes the redeploy and also removes the
stable name per environment, the per-branch D1 and the 1:1 mapping of D-010; mentioned so it is not
reinvented, not examined.

## Not tested

- Nothing was run against Cloudflare. In particular not: whether concurrent version uploads and deployments
  lose a binding or raise 10035; time and bytes of a bind with a real console; whether a service binding is
  counted in the 128-variable limit or in the 1 MB of metadata; whether an old gateway version that binds a
  deleted Worker can be redeployed; whether `workers.dev` calls between Workers of one account behave like
  bindings; whether Cloudflare exposes a REST endpoint to create a Preview.
- The code was read, not executed; the tests named were not run for this report (documentation only).
- The Cloudflare pages without a printed date (`d1/platform/limits`, `service-bindings`, `rollbacks`,
  `deployment-management`, `errors`) are cited as read on 2026-11-06. The KV figure is from a 2025
  changelog and may have moved. The 500-Workers figure carries a footnote on the limits page that points to
  Workers for Platforms for more; a limit-increase form exists on the same page, so the cap may be raisable
  on request (stated by the page for limits in general; this specific one is not confirmed).
- The Linear ticket FOR-20 and its relation to FOR-24 were read, not edited.
