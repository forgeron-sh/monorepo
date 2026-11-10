// The version of the published packages: `forgeron`, `@forgeron/sdk`, `@forgeron/runtime` and
// `@forgeron/manifest` are released together under one number (D-122). The build writes it in
// (`tsdown.config.ts`, `define`); run from the sources, the CLI says 0.0.0.
declare const __FORGERON_VERSION__: string | undefined;

export const VERSION: string =
  typeof __FORGERON_VERSION__ === "string" ? __FORGERON_VERSION__ : "0.0.0";
