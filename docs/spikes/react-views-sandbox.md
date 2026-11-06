# Spike FOR-49: can the CSP sandbox host React views and `@forgeron/ui`?

Written 2026-11-06. Decision: D-080. The prototype is throwaway, lives outside the repository and is not in this pull
request.

## Verdict

1. **Yes, the sandbox hosts React and `@forgeron/ui`. Keep it; do not move views to a dedicated
   origin.** A real build of the dashboard template's `monday.tsx` (React 19, `@forgeron/ui`,
   `@forgeron/sdk/react`) rendered under the exact `VIEW_CSP` of `apps/gateway/src/views/serve.ts`,
   read its data through the view token as a Bearer, and survived a stricter CSP (`script-src 'self'`,
   `style-src 'self'`, `font-src 'self'`, `connect-src 'self'`, `default-src 'none'`). Downloads work.
   Popups open (as sandboxed pages). The URL parameters (`useParams`) work.
2. **What the sandbox takes away is what §7 wants it to take away:** `localStorage`,
   `sessionStorage`, `indexedDB`, `caches`, service workers and `document.cookie` all throw
   `SecurityError`; no cookie is sent on any request the page makes, even with
   `credentials: "include"` and a session cookie planted. `@forgeron/ui` and `@forgeron/sdk` do not use
   any of them (grep). A view that wants to remember something must ask an action.
3. **The sandbox is not what is in the way. The pipeline around it is not finished.** Four things
   stop a React view from working end to end today, none of them caused by `sandbox`:
   - **CORS on `/_f/call/<action>` (blocking).** A sandboxed page has the origin `null`; its `fetch`
     to the gateway is cross-origin, and `Authorization` + JSON content type forces a preflight. The
     runtime answers `OPTIONS` with 405 and sets no `Access-Control-*`, so every action call fails.
     Measured: the page renders and stays on "…" (preflight 405). With a CORS answer it works.
   - **Nothing mounts the view (blocking).** The build emits `views/<name>.js` whose default export is
     the `defineView` object; the served page loads it as a module and nothing calls `createRoot`,
     `ViewHost` or `createHttpRuntime` (grep: only the SDK and its tests). The page would be blank.
   - **`serveView` has no production caller.** It is exported and tested, and no code path calls it
     (grep); the tool Worker does not serve pages or `/_f/views/*` either. See "Inconsistencies".
   - **CSS cannot be bundled.** The compiler's Rolldown (1.2.16) refuses CSS
     (`Bundling CSS is no longer supported`), so `import "@forgeron/ui/styles.css"` fails the build, and
     the page has no `<link>`. The fonts are four woff2 files of about 170 to 190 KB each.
4. **Size:** the dashboard view is **330 KB raw, 99 KB gzip, 84 KB brotli** of JavaScript, plus
   37 KB (6.8 KB gzip) of CSS and 729 KB of fonts. React is 220 KB raw of it, **zod about 95 KB raw
   (25 KB gzip)**, `@forgeron/ui` for five components about 4 KB.
5. **Recommendation:** answer §20 "sandbox suffices, no dedicated origin"; add the work in the tickets
   below, and decide the 15-minute token problem (a page open all day stops working) before the first
   dashboard goes to a collectivité.

## Question

Is `Content-Security-Policy: sandbox allow-scripts allow-forms allow-popups allow-downloads` (opaque
origin, no `allow-same-origin`) suitable for React views and `@forgeron/ui`? Can the bundle built by the
compiler run in such a page, how does it get its data, what do fonts, CSS and the CSP directives need,
what breaks, and how big is it? If it does not hold, do views move to an origin dedicated to views
(`acme.forgeron-views.app/t/crm`, `sdk.md` §7)?

## Method

Read the code and the docs, built a prototype with the repository's own pieces, ran it in a real
browser, measured. Everything below was run on 2026-11-06 on one machine.

**Read** (fact):

- `docs/sdk.md` §7 (Isolation, points 2 and 3, and the dedicated-origin fallback), §11, §20; D-016,
  D-020, D-043; `docs/examples/04-dashboard.md`.
- `apps/gateway/src/views/serve.ts` (page, bootstrap, token, `/_f/views/*` with
  `access-control-allow-origin: *` and an immutable cache), `apps/gateway/src/dispatch/dispatch.ts`
  (`confined`: the same sandbox CSP on every tool response, `set-cookie` stripped, since #141),
  `apps/gateway/src/identity/authn/caller.ts`, `packages/runtime/src/{runtime,api}.ts` (`/_f/call`),
  `packages/sdk/src/react/*` (`createHttpRuntime`, `ViewHost`), `packages/compiler/src/build.ts`
  (`buildViews`), `packages/ui` (`package.json`, `styles.css`, `tokens`), `templates/dashboard/views/monday.tsx`.

**Prototype** (outside the repository, scratchpad `proto/`):

- `view.tsx`: a copy of the template's `monday.tsx`. `mount.tsx`: what a compiler-generated entry would
  be: read `#forgeron-bootstrap`, `createHttpRuntime`, `ViewHost`, `createRoot`, a `?owner=` params store
  over `history.replaceState`, and a `<link>` to the CSS.
- Built with the repository's Rolldown 1.2.16 with the options of `buildViews` (`platform: "browser"`,
  `react-jsx`, `process.env.NODE_ENV` defined, minified). CSS and fonts copied by hand (see CSS).
- A Bun server on `localhost` that calls the **real** `serveView` (so the real CSP, bootstrap, token
  and asset headers) and verifies the token with the real `verifyToken` (audience `acme/<tool>`).
  Three tool names: `proto` (the runtime as it is: no CORS on `/_f/call`), `protocors` (a CORS answer on
  `/_f/call`), `protostrict` and `protostrict2` (the CORS answer plus extra CSP directives).
  Responses carry the sandbox CSP like `confined` does.
- A probe page with the same header, which tries each browser capability and records the result.
- Driven with `agent-browser` (headless Chrome 156) against `localhost` only. No real environment, no
  Cloudflare credential.

**Limits.** One browser engine (Chrome 156, headless). Firefox and Safari were not run. The Claude
desktop browser pane was tried first and **cannot be used for this test**: it blocks every request made
from the null-origin page (`ERR_BLOCKED_BY_CLIENT`), including the module script, so its blank page
says nothing about the design. It also loaded a popup as a normal tab. The server is not the gateway: the
cookie rules, the dispatch and the tool Worker were not run together; I reproduced their headers. No
workerd, no real Workers for Platforms. The data is fixed JSON, not the CRM. The clipboard, `<dialog>`,
`Menu` and `Drawer` components were not exercised.

## Measurements

### What the sandbox allows (probe and real view, Chrome 156)

| Capability                                       | Result                                                                                            |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| `window.origin`                                  | `"null"` (`location.origin` still prints the URL's origin: do not use it as a test)               |
| `localStorage`, `sessionStorage`                 | throws `SecurityError` on first access ("lacks the 'allow-same-origin' flag")                     |
| `indexedDB`, `caches`, `navigator.serviceWorker` | throw `SecurityError`                                                                             |
| `document.cookie` read and write                 | throws `SecurityError`                                                                            |
| Cookie on the page's requests                    | **none**, with a session cookie planted and `credentials: "include"` (server log)                 |
| Cookie on the page's own navigation (the `GET`)  | sent: that is how the access check happens before the token is issued                             |
| `history.replaceState` (the URL parameters)      | works; `setParams` rewrote `?owner=bob%40acme.fr` and refetched                                   |
| Blob `Worker`                                    | works                                                                                             |
| Download (`<a download>` of a blob URL)          | works (`allow-downloads`); the file was written                                                   |
| `window.open` to the same site                   | opens; the popup is itself sandboxed (`window.origin` is `"null"`, storage throws), `opener` kept |
| `fetch` to the gateway without CORS answer       | fails (`Failed to fetch`)                                                                         |
| `fetch` with `Authorization` and a CORS answer   | works                                                                                             |
| Module script, CSS and fonts from `/_f/views/*`  | load (`access-control-allow-origin: *` of `serveView`)                                            |
| Clipboard                                        | not conclusive: headless Chrome denies the permission; `CopyBlock` was not tested                 |

Popups to **other** sites inherit the sandbox when `allow-popups-to-escape-sandbox` is absent
(browser specification; deduction, not run): a payment page or an OAuth screen opened with
`window.open` from a view would load without storage and may break.

### Data path

The page `GET` carries the cookie, the gateway checks the access level and issues the 15-minute token
(`audience acme/<tool>`), embeds it in `#forgeron-bootstrap`, and the hooks call
`POST <base>/_f/call/<action>` with `Authorization: Bearer`. Measured on the prototype: `OPTIONS` then
`POST` with the Bearer and no cookie. Without the CORS answer the page stayed on its loading state:
`OPTIONS /t/proto/_f/call/sales.summary` is 405 in the log and no `POST` follows. `postMessage` was not
needed: a Bearer `fetch` is enough, and it is what `createHttpRuntime` already does.

### CSP directives

The page needs only `sandbox` to run. Adding the following, the real view still rendered and the
console showed no violation (`protostrict`):

```text
default-src 'none'; script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self' data:;
connect-src 'self'; base-uri 'none'; form-action 'none'
```

- `script-src 'self'`: the page has one module script from the same host; the JSON bootstrap is a data
  block and is not executed. React's production build needs no `unsafe-eval`. `'self'` matches the
  response URL's origin under `sandbox`.
- `style-src 'self'`: the three inline `style` attributes of `BarChart` (bar widths, 21.4286%, 50%,
  100%) were applied, because React sets them through the CSSOM, which the policy does not block. A
  library that writes a `style` attribute as markup or a `<style>` element would need
  `style-src-attr 'unsafe-inline'` or a nonce (`protostrict2` shows the attribute directive parses and
  changes nothing here).
- `font-src 'self'`: the woff2 files are at `/_f/views/fonts/*`; they load in CORS mode, which the
  `access-control-allow-origin: *` of the assets already answers.
- `connect-src 'self'` still allows the call to the gateway; it is the directive that stops a view from
  sending data to a third party. Whether to open `connect-src` for a tool's own external APIs is a
  product decision (see tickets).
- `frame-ancestors`: not set today on views. The playground sets `frame-ancestors 'none'`.

### Size (Rolldown, minified, one entry; brotli by Node `zlib`)

| Build                                               |     Raw (B) |   Gzip (B) | Brotli (B) |
| --------------------------------------------------- | ----------: | ---------: | ---------: |
| `react-dom` only (`createRoot` and a `<p>`)         |     220 603 |     68 706 |     58 273 |
| + `@forgeron/sdk/react` (hooks, `ViewHost`)         |     225 104 |     70 421 |     59 720 |
| + `z` from `@forgeron/sdk` (zod), no `@forgeron/ui` |     320 164 |     95 618 |     81 574 |
| `react-dom` + five `@forgeron/ui` components        |     224 110 |     69 621 |     59 180 |
| **Dashboard view (sdk + ui + zod)**                 | **329 841** | **98 870** | **84 307** |

- `@forgeron/ui` tree-shakes: five components cost about 3.5 KB raw. The barrel `index.ts` also exports
  `Markdown` (`react-markdown`), `DataGrid`, `ToolCard`…; none of them reached the bundle.
- Zod is the second cost. `defineView({ params })` needs it in the browser (`ViewHost` calls
  `params.safeParse`), and the template imports `z` from `@forgeron/sdk`; there is no zod-free path today.
- CSS: `tokens.css` + `components.css` = 37 655 B, 6 755 B gzip. Fonts: Inter Regular 168 784,
  Medium 185 968, SemiBold 188 500, Inter Display SemiBold 185 788 B (woff2, already compressed): 729 KB
  for the four, `font-display: swap`.
- Each view is its own entry with shared chunks in the real build; the numbers above are one entry
  with everything inlined, so the first view is representative and the next ones should be smaller.

## Inconsistencies (ticket, docs, code)

1. **Where views are served.** `sdk.md` §11: "served by the tool's Worker, behind the SSO". D-020 and
   `serve.ts`: served by the gateway. **In the code, nobody serves them:** `serveView` is not called
   outside its tests, the dispatch forwards `/t/<tool>/monday` to the tool Worker, and `createRuntime`
   handles `/mcp`, `/api`, `/cli` and `/_f/call` only. D-016 reads as if the pipeline works; only its
   pieces are done (FOR-59 serves, FOR-52 hooks, compiler builds).
2. **Nothing mounts a view**, see verdict 3. `sdk.md` §11 and D-020 describe "a statically served React
   app"; the build output is a module with a definition, not an app.
3. **Docs examples drift from the API.** `docs/examples/04-dashboard.md` and `sdk.md` §11 import from
   `forgeron/react` and use `<Select label options onChange(owner)>`, `<Stat format="currency">`,
   `<BarChart x y>`, `<Table columns={[…strings]}>`; the template and the package use
   `@forgeron/sdk/react`, `aria-label`, an event handler, `BarChart data={{label,value}}` and column objects.
4. **`sdk.md` §7 and the ticket mention only storage, downloads and "libraries needing a real origin".**
   The real blockers are the three of verdict 3 (CORS, mount, CSS), which neither mentions. §20's open
   question is answered by this spike but still open in `sdk.md`.
5. **Cache.** `serveView` serves `/_f/views/<file>` as `public, max-age=31536000, immutable`, and the
   build writes entries as `[name].js` without a hash in the name (only chunks have one). If the URL is
   not versioned by the gateway, a deployed change to a view may be hidden by browser or edge caches for a
   year. Deduction from the two files; I found no version in the path. To be checked, not tested.
6. **Token lifetime against the use case.** `sdk.md` §11: "after 15 minutes the hooks fail and the page
   must be reloaded". Example 04 is a page for a Monday meeting; `useAction(..., { refresh })` polls. A tab
   left open stops working with "This page has expired: reload it." (`http.ts`, read, not run).

## Risks

- **Data cannot leave through `connect-src`, but a view can still navigate.** `allow-popups` lets a view
  open a top-level GET on any workspace URL with the person's cookie (Lax); the response is not readable
  by the view. Not new, not a blocker; worth knowing when adding GET endpoints that act.
- **`ACAO: *` on `/_f/call`** is acceptable only because that endpoint is authenticated by the audience
  Bearer and not by the cookie (the cookie is not sent from the null origin, measured). It must never
  accept the session cookie, and the answer must not use `Allow-Credentials`.
- **Libraries that touch `localStorage` at import time** (themes, some state stores, analytics) crash the
  whole bundle with `SecurityError`, not just their feature. A developer finds out in the browser.
  `forgeron dev` and the playground must run views in the same sandbox, or the failure is silent locally.
- **Zod cost** (25 KB gzip) is paid by every view, and `@forgeron/sdk` has no zod-free entry.
- **Fonts** are 729 KB per cold load and not in the build's hash list (which lists JavaScript only).
- **Browser coverage:** only Chrome was run; `sandbox` is old and consistent, but popup inheritance,
  `blob:` downloads and `style-src` handling differ between engines.
- **Dedicated origin was not needed, and it would cost more:** a second wildcard certificate, a second
  cookie scope, a second set of CORS rules, and it would still need CORS for the call (the view origin
  would differ from the workspace origin). Keep it as the fallback of §7 only for a case the sandbox
  cannot cover (storage the person must keep).

## Proposed Linear tickets (not created)

1. **Serve the views: call `serveView` from the dispatch** with the built `views/` of the version
   (`ViewAssets` over the hosting's files). Acceptance: `GET /t/<tool>/<view path>` on a preview returns
   the page; `/_f/views/*` is served; a test in the gateway with a fake `Target`. Blocks the rest.
2. **Mount entry in the build.** The compiler generates an entry per view (bootstrap, `createHttpRuntime`,
   params store over `history.replaceState`, `ViewHost`, `createRoot`); `views/<name>.js` becomes the app.
   Acceptance: the dashboard template renders in a browser against a preview.
3. **CORS for `/_f/call/<action>`:** answer `OPTIONS` and add `Access-Control-Allow-Origin: *`,
   `-Headers: authorization, content-type`, `-Methods: POST` in the runtime (or the dispatch for that
   path only); never `Allow-Credentials`; a test that a request with the cookie and no Bearer is refused.
4. **CSS and fonts for views.** Rolldown cannot bundle CSS: either a build step that concatenates
   `@forgeron/ui` styles and the tool's own CSS into `views/<name>.css` and copies the fonts, with the
   `<link>` in the page template (`serveView`), or inline the CSS. Include CSS and fonts in the build's
   hash list. Decide whether the four Inter weights are all needed (729 KB).
5. **Tighten the views' CSP:** add `default-src 'none'; script-src 'self'; style-src 'self'; font-src 'self';
   img-src 'self' data:; connect-src 'self'; base-uri 'none'; form-action 'none'` to `VIEW_CSP`'s sibling
   header, with a test that the real built view still renders (browser test in CI, one engine to start).
   Decide separately how a tool declares external `connect-src` or `img-src` hosts.
6. **Cache the entries correctly:** content-hash the entry file names, or version the `/_f/views/` path
   by build; keep `immutable` only for hashed names; `no-cache` for the HTML (already `no-store`).
7. **Token renewal for long-lived pages.** Options: a renewal action the hooks call before expiry
   with the still-valid token (a token can be exchanged for a new one of the same audience, bounded in
   total age); or a `postMessage` to a Forgeron shell page that holds the session. Pick one and write
   the decision. Acceptance: a tab left open for an hour keeps polling.
8. **Docs.** Update `sdk.md` §7 (the sandbox suffices; list what it removes and that a view keeps no
   state in the browser), §11 (who serves, what mounts, the real API of the examples) and §20 (close the
   question with this report), and fix the drift of `docs/examples/04-dashboard.md`. Record the decision
   as a D-0xx once the owner confirms (this report does not take one).
9. **Browser tests for views:** a Playwright-style test that loads a built template under the real CSP
   in Chromium (and later WebKit and Firefox), fails on `SecurityError` in the console, and checks the
   action call goes through. This is the test that would have caught items 2 to 4.
10. **A zod-free `defineView` path** (zod/mini or a smaller params parser) if the 25 KB gzip matters
    to the first customers; measure on a real collectivité's connection before doing it.

## Not tested

- Firefox and Safari; mobile browsers; Chrome with third-party cookie blocking.
- A real gateway, dispatch, tool Worker or workerd: only headers reproduced from the code.
- Clipboard (`CopyBlock`), `Dialog`, `Menu`, `Drawer`, `Markdown`, `DataGrid`, `Tabs` of `@forgeron/ui`.
- Popups to external sites, `window.open` with `noopener`, OAuth or payment pages from a view.
- Views embedded in an `iframe` of a Forgeron page (the code serves them as top-level documents).
- Token expiry in a browser (read in `http.ts`, not run), and the cache behaviour of item 5.
- Any real tool data; the CRM; the size of a bundle with charts or a table library added.
