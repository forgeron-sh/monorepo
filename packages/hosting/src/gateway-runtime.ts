// The Workers runtime settings the gateway bundle needs, named once: the gateway build
// (`apps/gateway/scripts/build.ts`), `forgeron platform install` and `apps/gateway/wrangler.jsonc`
// (checked by a test) all read them from here. Neutral: plain data.

/** Compatibility date the gateway Worker runs with. */
export const GATEWAY_COMPATIBILITY_DATE = "2026-10-01";

/** Compatibility flags the gateway Worker runs with. */
export const GATEWAY_COMPATIBILITY_FLAGS: readonly string[] = ["nodejs_compat"];
