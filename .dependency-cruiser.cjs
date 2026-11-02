// Règles d'import entre apps, paquets et modèles. Voir docs/ARCHITECTURE.md, « Règles de dépendance ».
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
      // Un modèle est un tool comme un autre : il ne voit que l'API publique.
      name: "templates-use-public-sdk-only",
      severity: "error",
      from: { path: "^templates/" },
      to: { path: "^packages/(runtime|compiler|manifest)/" },
    },
    {
      // Le runtime tourne dans workerd : pas de module Node (`node:*`, `fs`…).
      name: "runtime-stays-on-workers",
      severity: "error",
      from: { path: "^packages/runtime/" },
      to: { dependencyTypes: ["core"] },
    },
    {
      // ... ni le compilateur (hors types).
      name: "runtime-does-not-import-compiler",
      severity: "error",
      from: { path: "^packages/runtime/" },
      to: { path: "^packages/compiler/", dependencyTypesNot: ["type-only"] },
    },
    {
      // Un tool n'embarque jamais d'outil de build ou de déploiement.
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
