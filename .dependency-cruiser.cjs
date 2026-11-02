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
      name: "ui-does-not-import-sdk",
      severity: "error",
      from: { path: "^packages/ui/" },
      to: { path: "^packages/(sdk|runtime|compiler)/" },
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
