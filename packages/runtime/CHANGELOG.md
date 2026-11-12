# Changelog

## [0.3.0](https://github.com/forgeron-sh/monorepo/compare/runtime-v0.2.0...runtime-v0.3.0) (2026-11-12)


### Miscellaneous Chores

* **runtime:** Synchronize forgeron versions

## [0.2.0](https://github.com/forgeron-sh/monorepo/compare/runtime-v0.1.1...runtime-v0.2.0) (2026-11-10)


### Features

* **cli,sdk,runtime,manifest:** publishable npm packages built by tsdown, released together (D-122) ([d125126](https://github.com/forgeron-sh/monorepo/commit/d125126e82e4a3a41d9ef3415b789297c9a58668))
* **cli,sdk,runtime,manifest:** publishable npm packages built by tsdown, released together (D-122) ([816b73c](https://github.com/forgeron-sh/monorepo/commit/816b73c296bda0de7d689e6038219f16c79ebf57))
* **gateway,console,registry,sdk:** views honour the access matrix, save it atomically (FOR-43) ([#94](https://github.com/forgeron-sh/monorepo/issues/94)) ([16914f6](https://github.com/forgeron-sh/monorepo/commit/16914f6d3ed88d3c8b2196f347b42ef3779ca5e8))
* **gateway,console,runtime:** the secret registry's leftovers (FOR-172) ([#174](https://github.com/forgeron-sh/monorepo/issues/174)) ([a4cabc7](https://github.com/forgeron-sh/monorepo/commit/a4cabc774b859157fb830bd392350ff68bbadc3e))
* **gateway,runtime:** hand a delegated connector the caller's consent at run time (FOR-79) ([#95](https://github.com/forgeron-sh/monorepo/issues/95)) ([bc8fdb4](https://github.com/forgeron-sh/monorepo/commit/bc8fdb426191f907812ec4283c33bf4e0cea5b46))
* **gateway:** one page shell for every page the gateway serves (FOR-128) ([#106](https://github.com/forgeron-sh/monorepo/issues/106)) ([6cc0a61](https://github.com/forgeron-sh/monorepo/commit/6cc0a619c48ff3b638d46e1ea4eda4aec283827e))
* **gateway:** revoke and rotate tokens, collect per-person secrets (FOR-38, FOR-95) ([#91](https://github.com/forgeron-sh/monorepo/issues/91)) ([bd62a06](https://github.com/forgeron-sh/monorepo/commit/bd62a06e2ffc85c8012bdb0e22f4aeba9960631c))
* **gateway:** run a tool's setup before the OAuth click (FOR-171) ([#160](https://github.com/forgeron-sh/monorepo/issues/160)) ([5cb9d45](https://github.com/forgeron-sh/monorepo/commit/5cb9d456b103c2c66fce90986ee21d23838450ea))
* **gateway:** serve views sandboxed with a CSP and a short-lived per-tool token (FOR-59) ([#51](https://github.com/forgeron-sh/monorepo/issues/51)) ([6b636b0](https://github.com/forgeron-sh/monorepo/commit/6b636b097c0630db1a3f761e0a5c7a06b135d6c5))
* **hosting,registry,gateway,cli,console:** remove the pilot environment (FOR-132) ([#108](https://github.com/forgeron-sh/monorepo/issues/108)) ([0acc84f](https://github.com/forgeron-sh/monorepo/commit/0acc84f21292d0e0b6882be9aa651373b0c90aa0))
* **manifest:** derive the MCP, API and CLI addresses of an action from its name ([#17](https://github.com/forgeron-sh/monorepo/issues/17)) ([944a7af](https://github.com/forgeron-sh/monorepo/commit/944a7af1ef0b8229479507ee026367c5926c7add))
* **registry,gateway:** offer a person's saved secrets at setup by kind (FOR-172) ([#168](https://github.com/forgeron-sh/monorepo/issues/168)) ([1e9c363](https://github.com/forgeron-sh/monorepo/commit/1e9c363256c89a8fba3706e51fe5fbf0d2838cf0))
* **registry,runtime,console:** edit the roles x actions matrix without a redeploy (FOR-43) ([#74](https://github.com/forgeron-sh/monorepo/issues/74)) ([54e2fb6](https://github.com/forgeron-sh/monorepo/commit/54e2fb635d057efd06c6846f563f74abfdbc7ef7))
* **registry,runtime,gateway:** keep a person's setup values, ask at /setup (FOR-171) ([#159](https://github.com/forgeron-sh/monorepo/issues/159)) ([506f945](https://github.com/forgeron-sh/monorepo/commit/506f9456fe6b2762900de61227961b2446a8c498))
* **runtime,gateway:** check a tool's setup before keeping it (FOR-171) ([#163](https://github.com/forgeron-sh/monorepo/issues/163)) ([0788c67](https://github.com/forgeron-sh/monorepo/commit/0788c67e5d147836e5518bd2241f5c9e90ea4bc5))
* **runtime:** collect per-person secrets on first use on each interface (FOR-95) ([#56](https://github.com/forgeron-sh/monorepo/issues/56)) ([e63c4da](https://github.com/forgeron-sh/monorepo/commit/e63c4da106146fca54b8862bd8ab44f9eb913beb))
* **runtime:** map every error code to the CLI exit codes and log refused outbound calls ([#15](https://github.com/forgeron-sh/monorepo/issues/15)) ([f870988](https://github.com/forgeron-sh/monorepo/commit/f870988c714773ce3bfeee831ea7b0392a6836db))
* **runtime:** refuse tokens of another tool, prove one access check everywhere (FOR-90) ([#34](https://github.com/forgeron-sh/monorepo/issues/34)) ([73583dc](https://github.com/forgeron-sh/monorepo/commit/73583dc5373d27486997b804700abbdac9925bf9))
* **runtime:** run event handlers in sync and queue modes and scheduled tasks ([#21](https://github.com/forgeron-sh/monorepo/issues/21)) ([8644e7b](https://github.com/forgeron-sh/monorepo/commit/8644e7bb4d9a57aa206b62f899577ddec7d64b81))
* **runtime:** serve MCP, API, CLI and web from the manifest with access checks ([#9](https://github.com/forgeron-sh/monorepo/issues/9)) ([2456473](https://github.com/forgeron-sh/monorepo/commit/245647383bded7d85907cdc70e733db1e0a826bb))
* **sdk:** declare tables and query them with a typed ctx.db on D1 ([#24](https://github.com/forgeron-sh/monorepo/issues/24)) ([9e0aecc](https://github.com/forgeron-sh/monorepo/commit/9e0aeccd88cf8c0201f26ddcb264880f723ce70d))
* **sdk:** provide forgeron/testing with createTestTool and mockFetch ([#11](https://github.com/forgeron-sh/monorepo/issues/11)) ([8597435](https://github.com/forgeron-sh/monorepo/commit/85974352f9852903e1f0758d2c76909144cd0ccf))


### Bug Fixes

* **cli:** publish the forgeron bin without a leading ./, release 0.1.1 ([4f2021c](https://github.com/forgeron-sh/monorepo/commit/4f2021ced002b11c561c139e776ed1e2280318c8))
* **cli:** publish the forgeron bin without a leading ./, release 0.1.1 ([932ceb9](https://github.com/forgeron-sh/monorepo/commit/932ceb93cc4b2fde07d0c167aa5fe37bba9d1f9d))
