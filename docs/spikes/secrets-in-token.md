# Spike FOR-172: per-person secrets carried in the OAuth token, never stored

Project "Identity, access and usage log". Written 2026-11-09. Documentation only: no code was changed and
nothing was run. Labels used below: **Fact** (read in the code or a decision of this repository),
**Deduction** (follows from facts), **Hypothesis** (plausible, not checked). The owner's direction (oral,
2026-11-07, quoted in the ticket) is the brief: for some tools, such as Odoo, a person's secret lives in the
token their client sends, so that neither the tool nor the gateway keeps it.

## Verdict

1. **Feasible, as an opt-in property of a secret field, not as a replacement of D-036.** A field declares where
   its value rests: `field.secret({ …, keep: "platform" })` (today, the default) or `keep: "token"`. The tool's
   code is the same either way: it still reads `ctx.userSecrets.NAME`, filled from the same header.
2. **What it buys is real and narrow**: the platform's database holds nothing of that person's secret, so a
   copy of the D1 reveals none of them, and removing a person has nothing to delete. **What it costs is real
   too**: an admin can no longer see that a secret exists or clear one; changing a secret means connecting
   again; the sealing key cannot be rotated without ending every connection that carries a secret; and it only
   works where a person connects through OAuth.
3. **A token-borne secret cannot be asked on the setup page** (D-097, D-098). The page posts to the gateway,
   which would have to keep the value somewhere between the page and the token. It is asked **on the consent
   page** instead, and goes straight into the authorization code. This is the main change to the design of
   FOR-171, and it is decision 2 below.
4. **A tool that uses it is MCP-only for that person**, unless the owner accepts a second place that issues
   tokens (decision 1). The Odoo template declares `cli: true` today.
5. **Recommendation: do it for the Odoo case, in the order of the tickets below, after the `check` call.**
   Not before: the two flows (stored and token-borne) share the page, the header and the 428, and the first
   one is not used on a real install yet.

## Question

Where does the value live if it is not in the registry; what happens at refresh and at revocation; what can
the gateway still log; what is the threat model compared with D-036; what is lost and what is gained?

## Method

Read: D-013, D-015, D-035, D-036, D-084, D-094 to D-098; `identity/authn/tokens.ts` and `sealed.ts`,
`identity/mcp-oauth/mcp-oauth.ts`, `dispatch/user-secrets.ts` (`forwardIdentity`), `packages/runtime/src/engine.ts`
(the `428`, `queue` deliveries), `packages/registry/src/secret-box.ts`, `docs/self-host.md` (keys). No real
Cloudflare account and no MCP client were used. The Cloudflare facts about Queues and logs are not re-read for
this report (see "Not tested").

## What exists (facts)

- **Stored model (D-036).** `user_secrets`: one row per tool, person and name, sealed with AES-GCM under
  `SECRETS_KEY`, the slot as additional data. Only the gateway decrypts, to build the header
  `x-forgeron-user-secrets` of one call. A removed member's rows are deleted with them since D-097.
- **Tokens (D-015, D-094).** A token is `fgt.<claims>.<HMAC>`: the claims are **signed, not encrypted**.
  The access token of an OAuth connection lives one hour; the refresh token (`fgr.`) 30 days and rotates; the
  family id is the `jti` of every access token of the connection, so revoking it ends them all (D-035).
- **Keys.** `AUTH_SECRET` signs tokens and has `AUTH_SECRET_PREVIOUS` for an overlap (D-035). `SECRETS_KEY`
  encrypts secrets and **has no previous key**: `docs/self-host.md` says its rotation is not done and that a
  new key makes stored secrets unreadable.
- **Where a secret goes after a call.** `ctx.userSecrets` of an action, from the header. A `queue` delivery
  carries `user`, `event` and `payload`; a scheduled task has `userSecrets: {}` (read in `engine.ts`).
  Nothing keeps a person's secret beyond the call.
- **Logs.** The gateway's and the runtime's logs never print a value today (D-036, D-097, D-098 and their
  tests); the audit line of a secret names the secret and never the value.

## Where the value could live

| Option                                                    | Verdict                                                                              |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| **A. Sealed claim inside the access and refresh tokens**  | **The one to take.** The client holds it, the gateway decrypts it on each call.      |
| B. A short-lived stored record keyed by the token's `jti` | Not "never stored": it is the stored model with a shorter life, and it adds a table. |
| C. In the authorization code only                         | A code lives 60 seconds: the secret would be gone after the first exchange.          |
| D. The client keeps it and sends it in a second header    | Not our protocol: a connector sends `Authorization` and nothing else.                |

**Option A in detail (deduction).**

- The secret is sealed with AES-GCM under a key **derived** from `SECRETS_KEY` for this purpose (HKDF with a
  fixed label), with the token's `jti`, audience and the field name as additional data, so a sealed value
  cannot be moved to another token, person or tool. The sealed value is a claim (`sec`) of the access token,
  which therefore needs a new prefix or a flag (`fgs.`): today's claims are readable by anyone holding the
  token (base64, signed only), and a secret must not be.
- **Size**: a 40-character key sealed is about 100 bytes in base64; one to three secrets fit well under a
  header limit. (Hypothesis: Cloudflare's header limit and the client's are far above that; not checked.)
- **At the code**: the consent page's form carries the secret fields; the POST seals them into the
  authorization code (which today is signed only and would become sealed too). The token endpoint puts them
  into the first access token and the first refresh token. Nothing is written to D1.
- **At refresh**: the gateway opens the old refresh token, takes the sealed secret out, and seals it again
  into the new pair (new `jti`-bound additional data). The secret never changes at refresh.
- **At each call**: `forwardIdentity` opens the token's claim and puts the plain value in the same header as
  today; the dispatcher already drops any such header sent by a caller (D-035).

## Revocation, rotation, logging

- **Revocation (fact + deduction).** Revoking the family (`token_revocations`) makes every access token and
  the refresh token refuse at once, so the secret is useless **to the platform** from that moment. It is not
  erased from the client that holds a copy: it is sealed under a key the client does not have, so the client
  cannot read it either. What an admin can no longer do is **clear one person's secret of one tool** while
  keeping their connection: there is nothing to clear. The only lever is to end the connection or the person's
  tokens.
- **A person who leaves** (D-097): nothing to delete. Gain.
- **Rotating `SECRETS_KEY`.** Stored model: not done (D-036/self-host: a new key makes stored values
  unreadable). Token model: a new key makes **every token that carries a secret** unreadable, and the person
  must connect again; with a previous key the overlap works as `AUTH_SECRET_PREVIOUS` does. Deduction: the
  token model needs `SECRETS_KEY_PREVIOUS` to be usable, and benefits from it more than the stored one does.
- **Logging.** The gateway must not log the header or the token (it does not today). A new risk: access logs of
  a proxy or the tool's own logging of request headers now see a token that **contains** a sealed secret, not
  only an identifier. The token was already a bearer credential, so this adds no new way to _use_ the secret;
  it adds a place a sealed value could be copied to. Sealed under a key held only by the gateway, such a copy is
  unreadable to whoever holds the logs.

## Threat model against D-036

| Attacker has…                               | Stored model (D-036)                                                             | Token model (option A)                                             |
| ------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| A copy of the D1                            | Sealed secrets of everyone; useless without `SECRETS_KEY`                        | **Nothing** of that person's secret                                |
| The D1 **and** `SECRETS_KEY`                | **Every secret of every person**                                                 | Nothing (it is not in the D1)                                      |
| `SECRETS_KEY` alone                         | Nothing                                                                          | Can open any token it has a copy of: one person's secret per token |
| A person's token (stolen from their client) | Can **use** the secret through the gateway, for the token's life; cannot read it | The same: can use it, cannot read it. Unchanged                    |
| The gateway Worker's memory during a call   | The plain secret of the caller                                                   | The same                                                           |
| The tool's code                             | The caller's plain secret, in that call                                          | The same (`ctx.userSecrets` is unchanged)                          |

**Deduction**: the gain is the first two rows, which is where an operator's worst day lies (a database leak
with the key). Nothing improves against a stolen client token or a hostile tool, and the tool still sees the
plain value in the call, as it does now (D-036 "Know").

## What is lost, what is gained

**Gained**

- The platform's database holds no personal secret of those fields: a D1 leak, even with the key, gives none.
- Nothing to delete for a person who leaves, nothing to describe in a retention policy for the secret, one
  less table of sensitive data to defend and to back up.
- A simpler promise to a customer: "Forgeron does not keep your Odoo key".

**Lost**

- **Seeing that a secret exists**: the admin's list of who holds which secret (`userSecretHolders`) has
  nothing to show for token-borne fields. The audit line at connection (names only) is the only trace.
- **Clearing one secret server side** without ending the connection (see Revocation).
- **Changing a secret without connecting again**: the person must run the OAuth dance again in each client
  (Claude desktop, Claude on the web, a second machine): **each connection holds its own copy** and must be
  given the secret. N clients, N entries.
- **Rotating the sealing key** without ending connections, unless a previous key is added.
- **Non-OAuth callers**: the CLI and API use tokens from `POST /auth/token` and `forgeron login`, which do not
  go through the consent page and cannot carry a secret.
- **Anything asynchronous on behalf of the person.** A `queue` event handler and a scheduled task have no
  caller token (read: they carry no secret today); a token-borne secret cannot reach them, and must not be put
  in a queue message to do so, since that would store it in Cloudflare's queue for the retries (Hypothesis:
  Queues keep messages for a time; not read for this report).
- **A background refresh of the secret** (an Odoo key that expires) is impossible: only the person can give a
  new one, by connecting again.

## Decisions for the owner

1. **The CLI and the API for a tool with a token-borne secret.** Recommended: **MCP only** for those fields. A
   tool that declares one cannot offer the CLI or API to a person for it (the build says so), or declares the
   same secret as `keep: "platform"` for them. The Odoo template would then drop `cli: true` or keep its
   secrets stored. Alternative: let `POST /auth/token` and `forgeron login` send the person through a web page
   that collects the secret and seals it into that token: it works, and doubles the surface that handles
   secrets.
2. **Where a token-borne secret is typed.** Recommended: on the **consent page** of the authorization step,
   never on `/t/<tool>/setup`. This means the OAuth step for a tool with such a field shows the setup's plain
   fields **and** those secrets on one page, instead of redirecting (D-098), for those fields only.
3. **Opt-in per field, default stays the platform's.** Recommended: yes. Making it the default would break the
   CLI, the admin's list and the rotation for every existing tool.
4. **A previous key for `SECRETS_KEY`** (`SECRETS_KEY_PREVIOUS`, as `AUTH_SECRET_PREVIOUS`). Recommended: yes,
   as part of ticket 1; the token model is not usable in production without it.
5. **The Odoo case specifically.** Recommended: token-borne for `ODOO_API_KEY` and stored for nothing else; the
   login is not a secret and becomes a plain field (decision 2 of FOR-171).

## Proposed Linear tickets (not created)

1. **`SECRETS_KEY_PREVIOUS`**: open with the current key then the previous ones, seal with the current; a test
   with a rotation; document in `self-host.md`. Useful on its own for the stored model.
2. **A sealed token format** (`fgs.`): sealed claim, additional data bound to `jti`, audience and field; tests
   that a claim cannot be moved to another token, person or tool, and that a tampered one is refused.
3. **`keep: "token"` in the declaration**: manifest, SDK, build rule (refuses the CLI and API interfaces for a
   tool that has one unless decision 1 says otherwise), diff.
4. **The consent page collects token-borne secrets**; the code and the refresh token carry them sealed; the
   token endpoint hands them to the first pair; refresh re-seals.
5. **The gateway opens the claim and fills the header** in `forwardIdentity`; the admin's list says "kept by
   the person's client" for those fields; the audit line at connection.
6. **What a person sees**: the consent page says what is kept where, in words, and how to change a secret
   (connect again).
7. **The Odoo template** moves `ODOO_API_KEY` to `keep: "token"` and its CLI to stored or drops it.

## Risks

- **Two models in one product** is a cost: two ways a secret reaches a call, two stories for a customer, two
  sets of tests. The opt-in keeps it to the tools that ask for it.
- **A secret in a token is a larger bearer credential**: losing the token loses the right to use the Odoo key
  until the token expires or is revoked (an hour for access, 30 days for refresh, until the family is revoked).
  Unchanged in kind from the stored model, but the refresh token's 30 days now also keep the _sealed secret_
  alive on the client.
- **Support**: "my Odoo key stopped working" now means "connect again in every client", which is a worse
  answer than "type it once on the page".
- **A leaked `SECRETS_KEY` is worse for tokens already issued**: it opens every captured token, not only the
  database. Rotation (ticket 1) is the answer, and the key must stay out of the tool Worker (D-036: it is).

## Not tested

- Nothing was run. The Cloudflare behaviours that matter here (header size limits, whether Queues or Workers
  Logs retain request headers, how a Claude connector stores and resends a token) were not read or tried.
- No MCP client was connected: whether a connector keeps a refresh token that long, and sends it back
  unchanged, is assumed from the OAuth specification.
- The threat model is a reasoning on the code as read; it was not reviewed by anyone else.
