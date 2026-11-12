// The release and the commit this gateway was built from (D-123): `scripts/build.ts` writes them in
// (`define`). The console shows them, and a tool the gateway creates depends on the SDK of this
// release. Run from the sources, the gateway says 0.0.0 and no commit.
declare const __FORGERON_GATEWAY_VERSION__: string | undefined;
declare const __FORGERON_GATEWAY_COMMIT__: string | undefined;

export const GATEWAY_VERSION: string =
  typeof __FORGERON_GATEWAY_VERSION__ === "string" ? __FORGERON_GATEWAY_VERSION__ : "0.0.0";

export const GATEWAY_COMMIT: string | undefined =
  typeof __FORGERON_GATEWAY_COMMIT__ === "string" && __FORGERON_GATEWAY_COMMIT__ !== ""
    ? __FORGERON_GATEWAY_COMMIT__
    : undefined;
