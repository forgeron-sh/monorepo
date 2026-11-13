# Changelog

## [0.5.0](https://github.com/forgeron-sh/monorepo/compare/sdk-v0.4.0...sdk-v0.5.0) (2026-11-13)


### Features

* teams and permissions instead of roles, one permission engine (D-137) ([b5275e6](https://github.com/forgeron-sh/monorepo/commit/b5275e6cc320482c7a6c1742833b4c544e00e392))

## [0.4.0](https://github.com/forgeron-sh/monorepo/compare/sdk-v0.3.1...sdk-v0.4.0) (2026-11-13)


### Features

* realtime, channels a tool declares, published by actions and followed live (D-135) ([5723bab](https://github.com/forgeron-sh/monorepo/commit/5723babce7c5ab26aee45917152306467248b335))
* realtime, channels a tool declares, published by actions and followed live (D-135) ([278e5af](https://github.com/forgeron-sh/monorepo/commit/278e5af0dcb9793c01b96e1a16f4c4a424e0891c))
* **sdk:** ctx.directory, the workspace's people a tool asked for (D-131) ([1991bee](https://github.com/forgeron-sh/monorepo/commit/1991beedfb0e4ffb4ef1ce893e4be7895ecafb9f))
* **sdk:** ctx.directory, the workspace's people a tool asked for (D-131) ([092dc65](https://github.com/forgeron-sh/monorepo/commit/092dc658c19cab4b2ca14135ef8dd2a23c5e4175))
* tool profiles mapped to workspace roles, admin all and member default profile (D-127) ([526bbbb](https://github.com/forgeron-sh/monorepo/commit/526bbbbc73bf9ccb9f442c9fc55645c2afe41a44))
* tool profiles mapped to workspace roles, admin all and member default profile (D-127) ([3553f22](https://github.com/forgeron-sh/monorepo/commit/3553f223f73c34cf878ba0f9bcf371a4e41460e4))


### Bug Fixes

* **sdk:** export the directory types ([1d344d4](https://github.com/forgeron-sh/monorepo/commit/1d344d4a6ae49a0ad880bec497169205fb25802d))

## [0.3.1](https://github.com/forgeron-sh/monorepo/compare/sdk-v0.3.0...sdk-v0.3.1) (2026-11-12)


### Miscellaneous Chores

* **sdk:** Synchronize forgeron versions

## [0.3.0](https://github.com/forgeron-sh/monorepo/compare/sdk-v0.2.0...sdk-v0.3.0) (2026-11-12)


### Miscellaneous Chores

* **sdk:** Synchronize forgeron versions

## [0.2.0](https://github.com/forgeron-sh/monorepo/compare/sdk-v0.1.1...sdk-v0.2.0) (2026-11-10)


### Features

* **catalog:** tool README and images through build, registry and catalog API (FOR-137) ([#116](https://github.com/forgeron-sh/monorepo/issues/116)) ([7641308](https://github.com/forgeron-sh/monorepo/commit/764130800c33120d66ba191a81812623d58f4a78))
* **cli,sdk,runtime,manifest:** publishable npm packages built by tsdown, released together (D-122) ([d125126](https://github.com/forgeron-sh/monorepo/commit/d125126e82e4a3a41d9ef3415b789297c9a58668))
* **cli,sdk,runtime,manifest:** publishable npm packages built by tsdown, released together (D-122) ([816b73c](https://github.com/forgeron-sh/monorepo/commit/816b73c296bda0de7d689e6038219f16c79ebf57))
* **cli:** add the forgeron db commands and db/seed.ts (FOR-115, FOR-116) ([#27](https://github.com/forgeron-sh/monorepo/issues/27)) ([3a916ad](https://github.com/forgeron-sh/monorepo/commit/3a916ade23f700b95e0bb4332659724cf5208f39))
* **compiler:** fail the build on the rules of sdk.md section 14 ([#13](https://github.com/forgeron-sh/monorepo/issues/13)) ([722d2ce](https://github.com/forgeron-sh/monorepo/commit/722d2ce80ebbc929f3acc44a1fe40f32483fe778))
* **compiler:** generate migrations from the schema and apply them on deployment ([#25](https://github.com/forgeron-sh/monorepo/issues/25)) ([97177dd](https://github.com/forgeron-sh/monorepo/commit/97177ddff623426d36fc255feb5c97435505518b))
* **console,gateway,hosting,sdk,ui:** database explorer, read only (FOR-136) ([#115](https://github.com/forgeron-sh/monorepo/issues/115)) ([bc31446](https://github.com/forgeron-sh/monorepo/commit/bc31446ad8e1b15d2cd27704520a41623cd32eac))
* **gateway,console,registry,sdk:** views honour the access matrix, save it atomically (FOR-43) ([#94](https://github.com/forgeron-sh/monorepo/issues/94)) ([16914f6](https://github.com/forgeron-sh/monorepo/commit/16914f6d3ed88d3c8b2196f347b42ef3779ca5e8))
* **gateway:** serve views sandboxed with a CSP and a short-lived per-tool token (FOR-59) ([#51](https://github.com/forgeron-sh/monorepo/issues/51)) ([6b636b0](https://github.com/forgeron-sh/monorepo/commit/6b636b097c0630db1a3f761e0a5c7a06b135d6c5))
* **hosting,registry,gateway,cli,console:** remove the pilot environment (FOR-132) ([#108](https://github.com/forgeron-sh/monorepo/issues/108)) ([0acc84f](https://github.com/forgeron-sh/monorepo/commit/0acc84f21292d0e0b6882be9aa651373b0c90aa0))
* **manifest,sdk,compiler:** a tool declares a setup (FOR-171) ([#158](https://github.com/forgeron-sh/monorepo/issues/158)) ([072250e](https://github.com/forgeron-sh/monorepo/commit/072250eaceae5c9f18dbb3b626ce101830961aa0))
* **registry,gateway:** offer a person's saved secrets at setup by kind (FOR-172) ([#168](https://github.com/forgeron-sh/monorepo/issues/168)) ([1e9c363](https://github.com/forgeron-sh/monorepo/commit/1e9c363256c89a8fba3706e51fe5fbf0d2838cf0))
* **registry,runtime,gateway:** keep a person's setup values, ask at /setup (FOR-171) ([#159](https://github.com/forgeron-sh/monorepo/issues/159)) ([506f945](https://github.com/forgeron-sh/monorepo/commit/506f9456fe6b2762900de61227961b2446a8c498))
* **runtime:** collect per-person secrets on first use on each interface (FOR-95) ([#56](https://github.com/forgeron-sh/monorepo/issues/56)) ([e63c4da](https://github.com/forgeron-sh/monorepo/commit/e63c4da106146fca54b8862bd8ab44f9eb913beb))
* **runtime:** run event handlers in sync and queue modes and scheduled tasks ([#21](https://github.com/forgeron-sh/monorepo/issues/21)) ([8644e7b](https://github.com/forgeron-sh/monorepo/commit/8644e7bb4d9a57aa206b62f899577ddec7d64b81))
* **sdk,cli,registry:** a tool's summary and guide for its users, forgeron bundle (D-115) ([2ca7b1a](https://github.com/forgeron-sh/monorepo/commit/2ca7b1a993d42aacbe6cd3ae3e56e7e0f7877c6f))
* **sdk,cli,registry:** a tool's summary and guide for its users, forgeron bundle (D-115) ([584c245](https://github.com/forgeron-sh/monorepo/commit/584c24592a86c7ca00b86c29bc1ef32313a77c64))
* **sdk:** add defineView and the useAction, useMutation, useParams, useUser, useCan hooks (FOR-52) ([#35](https://github.com/forgeron-sh/monorepo/issues/35)) ([4f9e427](https://github.com/forgeron-sh/monorepo/commit/4f9e4278547ce5ee9a85a55264e1c760f7a71a00))
* **sdk:** declare tables and query them with a typed ctx.db on D1 ([#24](https://github.com/forgeron-sh/monorepo/issues/24)) ([9e0aecc](https://github.com/forgeron-sh/monorepo/commit/9e0aeccd88cf8c0201f26ddcb264880f723ce70d))
* **sdk:** define the connector interface with modes, scopes and host limits (FOR-71) ([#32](https://github.com/forgeron-sh/monorepo/issues/32)) ([f99e4a6](https://github.com/forgeron-sh/monorepo/commit/f99e4a669b6fd5be95bf9ec62b1b5a2cb278381f))
* **sdk:** implement the public API for tools without a database ([#8](https://github.com/forgeron-sh/monorepo/issues/8)) ([ef57a49](https://github.com/forgeron-sh/monorepo/commit/ef57a49ce271a224faf0ffef522245e8e5701cf3))
* **sdk:** provide forgeron/testing with createTestTool and mockFetch ([#11](https://github.com/forgeron-sh/monorepo/issues/11)) ([8597435](https://github.com/forgeron-sh/monorepo/commit/85974352f9852903e1f0758d2c76909144cd0ccf))
* **templates:** implement the crm template on D1 with events and roles ([#26](https://github.com/forgeron-sh/monorepo/issues/26)) ([c8e91b8](https://github.com/forgeron-sh/monorepo/commit/c8e91b84aa75e8cc4bc79bad4a5835428efee875))
* **templates:** implement the odoo-gateway template against a simulated Odoo ([#12](https://github.com/forgeron-sh/monorepo/issues/12)) ([8331055](https://github.com/forgeron-sh/monorepo/commit/83310550c2bf4dde481b4bb141682ffa5860f7e2))


### Bug Fixes

* **cli:** publish the forgeron bin without a leading ./, release 0.1.1 ([4f2021c](https://github.com/forgeron-sh/monorepo/commit/4f2021ced002b11c561c139e776ed1e2280318c8))
* **cli:** publish the forgeron bin without a leading ./, release 0.1.1 ([932ceb9](https://github.com/forgeron-sh/monorepo/commit/932ceb93cc4b2fde07d0c167aa5fe37bba9d1f9d))


### Performance Improvements

* **test:** run registry, gateway and hosting tests on in-memory D1, cache template builds ([#77](https://github.com/forgeron-sh/monorepo/issues/77)) ([22b09e7](https://github.com/forgeron-sh/monorepo/commit/22b09e7ff38d73ff9ca9ad5ed3c299bacb2eb5b3))
