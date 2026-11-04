// Import rules between apps, packages and templates. See docs/ARCHITECTURE.md, "Dependency rules".
module.exports = {
  forbidden: [
    { name: "no-cycles", severity: "error", from: {}, to: { circular: true } },
    { name: "no-unresolved", severity: "error", from: {}, to: { couldNotResolve: true } },
    {
      name: "packages-do-not-import-apps",
      severity: "error",
      from: { path: "^(packages|templates)/" },
      to: { path: "^apps/" },
    },
    {
      name: "apps-do-not-import-each-other",
      severity: "error",
      from: { path: "^apps/([^/]+)/" },
      to: { path: "^apps/([^/]+)/", pathNot: "^apps/$1/" },
    },
    {
      // A template is a tool like any other: it only sees the public API.
      name: "templates-use-public-sdk-only",
      severity: "error",
      from: { path: "^templates/" },
      to: { path: "^packages/(runtime|compiler|manifest)/" },
    },
    {
      // The runtime runs in workerd: no Node modules (`node:*`, `fs`…).
      name: "runtime-stays-on-workers",
      severity: "error",
      from: { path: "^packages/runtime/" },
      to: { dependencyTypes: ["core"] },
    },
    {
      // ... nor the compiler (types excepted).
      name: "runtime-does-not-import-compiler",
      severity: "error",
      from: { path: "^packages/runtime/" },
      to: { path: "^packages/compiler/", dependencyTypesNot: ["type-only"] },
    },
    {
      // A tool never ships build or deployment tooling.
      name: "sdk-stays-light",
      severity: "error",
      from: { path: "^packages/sdk/" },
      to: { path: "^packages/(compiler|hosting)/" },
    },
    {
      name: "manifest-is-a-leaf",
      severity: "error",
      from: { path: "^packages/manifest/" },
      to: { path: "^packages/(?!manifest/)" },
    },
    {
      // The contract is data that a server, the console and the CLI all read: no other package of ours
      // but the schemas it reuses. Its npm dependencies are `zod` only: knip fails an import that
      // `package.json` does not list (`exclude` keeps node_modules out of this graph).
      name: "platform-contract-imports-schemas-only",
      severity: "error",
      from: { path: "^packages/platform-contract/" },
      to: { path: "^packages/(?!platform-contract/|manifest/)" },
    },
    {
      name: "ui-does-not-import-sdk",
      severity: "error",
      from: { path: "^packages/ui/" },
      to: { path: "^packages/(sdk|runtime|compiler)/" },
    },
    {
      // The registry has one door: `@forgeron/registry` (`src/index.ts`). Nothing outside the
      // package reaches into its files (docs/spikes/module-model.md, FOR-155).
      name: "registry-door-is-index",
      severity: "error",
      from: { path: "^(apps|packages|templates|scripts)/", pathNot: "^packages/registry/" },
      to: { path: "^packages/registry/src/", pathNot: "^packages/registry/src/index\\.ts$" },
    },
    {
      // A registry module reaches another one through its `public.ts` only (FOR-156).
      name: "module-uses-public-api",
      severity: "error",
      from: { path: "^packages/registry/src/modules/([^/]+)/" },
      to: {
        path: "^packages/registry/src/modules/[^/]+/(?!public\\.ts$)",
        pathNot: "^packages/registry/src/modules/$1/",
      },
    },
    {
      // Nor does the rest of the registry (`registry.ts`, the stores at the root, tests) reach into a module.
      name: "registry-root-uses-module-public-api",
      severity: "error",
      from: { path: "^packages/registry/src/(?!modules/|kernel/)" },
      to: { path: "^packages/registry/src/modules/[^/]+/(?!public\\.ts$)" },
    },
    {
      // The kernel (ids, clock, SQL helpers, secret box, audit statement) knows no module.
      name: "kernel-is-generic",
      severity: "error",
      from: { path: "^packages/registry/src/kernel/" },
      to: { path: "^packages/registry/src/modules/" },
    },
    {
      // The gateway's kernel (`Person`, `workspaceOf`) is what identity, dispatch and pages share:
      // it imports none of them. This and the next rule keep the folders free of cycles, which
      // the file-level `no-cycles` cannot see.
      name: "gateway-kernel-is-a-leaf",
      severity: "error",
      from: { path: "^apps/gateway/src/kernel/" },
      to: { path: "^apps/gateway/src/", pathNot: "^apps/gateway/src/kernel/" },
    },
    {
      // Identity renders pages and asks nothing of dispatch; dispatch and pages never import identity.
      name: "identity-is-below-dispatch-and-pages",
      severity: "error",
      from: { path: "^apps/gateway/src/(dispatch|pages)/", pathNot: "\\.test\\.ts$" },
      to: { path: "^apps/gateway/src/identity/" },
    },
    {
      name: "identity-does-not-import-dispatch",
      severity: "error",
      from: { path: "^apps/gateway/src/identity/" },
      to: { path: "^apps/gateway/src/dispatch/" },
    },
  ],
  options: {
    doNotFollow: { path: "(^|/)(node_modules|dist)/" },
    exclude: "(^|/)(node_modules|\\.astro|\\.forgeron|generated)/",
    tsPreCompilationDeps: true,
    tsConfig: { fileName: "tsconfig.json" },
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "types", "default"],
    },
  },
};
