// Import rules between apps, packages and templates. See docs/ARCHITECTURE.md, "Dependency rules".
module.exports = {
  forbidden: [
    { name: "no-cycles", severity: "error", from: {}, to: { circular: true } },
    {
      // Vite's virtual modules (`virtual:…`, made by a plugin of the app's config) and Astro's
      // (`astro:content`, `astro:assets`…, made by Astro at build time) have no file.
      name: "no-unresolved",
      severity: "error",
      from: {},
      to: { couldNotResolve: true, pathNot: "^(virtual|astro):" },
    },
    {
      // Blueprint's parity suite is the exception: it renders the site's scenes, the scenes the
      // engine must reproduce (docs/blueprint/engine.md, P2), and ships nowhere.
      name: "packages-do-not-import-apps",
      severity: "error",
      from: { path: "^(packages|templates)/", pathNot: "^packages/blueprint/test/parity/" },
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
      // The engine of permissions is below everything that reads it: no package of ours.
      name: "permissions-is-a-leaf",
      severity: "error",
      from: { path: "^packages/permissions/" },
      to: { path: "^packages/(?!permissions/)" },
    },
    {
      // The manifest reaches the permissions engine and nothing else (D-137).
      name: "manifest-is-a-leaf",
      severity: "error",
      from: { path: "^packages/manifest/" },
      to: { path: "^packages/(?!manifest/|permissions/)" },
    },
    {
      // The contract is data that a server, the console and the CLI all read: no other package of ours
      // but the schemas it reuses. Its npm dependencies are `zod` only: knip fails an import that
      // `package.json` does not list (`exclude` keeps node_modules out of this graph).
      name: "platform-contract-imports-schemas-only",
      severity: "error",
      from: { path: "^packages/platform-contract/" },
      to: { path: "^packages/(?!platform-contract/|manifest/|permissions/)" },
    },
    {
      // Blueprint's core and its file format are data and pixels: they run at build time, in a
      // Worker and in the browser alike. The canvas glue (`dom/`) and React (`react/`) sit on top
      // of them, never under.
      name: "blueprint-core-is-framework-free",
      severity: "error",
      from: { path: "^packages/blueprint/src/(core|examples|format)/" },
      to: { path: "^packages/blueprint/src/(dom|react)/|(^|/)node_modules/(react|react-dom)/" },
    },
    {
      // ... and it imports no Node module (`node:*`, `fs`…).
      name: "blueprint-core-stays-neutral",
      severity: "error",
      from: { path: "^packages/blueprint/src/(core|examples|format)/" },
      to: { dependencyTypes: ["core"] },
    },
    {
      // Forgeron Sans (`@forgeron/font`) sits under ui and Blueprint, which both import it: it
      // imports no other package of ours.
      name: "font-is-a-leaf",
      severity: "error",
      from: { path: "^packages/font/" },
      to: { path: "^packages/(?!font/)" },
    },
    {
      // The effects (D-149, docs/shaders/design.md) sit under ui and Blueprint: both import
      // `@forgeron/shaders`, which imports no other package of ours (no ui, no Blueprint, no canvas).
      name: "shaders-is-a-leaf",
      severity: "error",
      from: { path: "^packages/shaders/" },
      to: { path: "^packages/(?!shaders/)" },
    },
    {
      // Its core (passes, sources, presets, GLSL as strings) runs at build time and in a Worker:
      // no DOM layer, no React ...
      name: "shaders-core-is-framework-free",
      severity: "error",
      from: { path: "^packages/shaders/src/(core/|index\\.ts$)" },
      to: { path: "^packages/shaders/src/dom/|(^|/)node_modules/(react|react-dom)/" },
    },
    {
      // ... and no Node module.
      name: "shaders-core-stays-neutral",
      severity: "error",
      from: { path: "^packages/shaders/src/(core/|index\\.ts$)" },
      to: { dependencyTypes: ["core"] },
    },
    {
      // The libraries are shared assets (one folder per type: `blueprints/`), data that the site,
      // the gallery and the parity tests read: they import no other package of ours.
      name: "libraries-is-a-leaf",
      severity: "error",
      from: { path: "^packages/libraries/" },
      to: { path: "^packages/(?!libraries/)" },
    },
    {
      name: "ui-does-not-import-sdk",
      severity: "error",
      from: { path: "^packages/ui/" },
      to: { path: "^packages/(sdk|runtime|compiler)/" },
    },
    {
      // The atoms render to static markup (Astro pages without JS, the console): from Blueprint they
      // take the neutral core (the pixel face), never the canvas glue or its React layer, and from
      // the icons the named exports, never the whole catalog.
      name: "ui-atoms-stay-static",
      severity: "error",
      from: { path: "^packages/ui/" },
      to: { path: "^packages/blueprint/src/(dom|react)/|^packages/icons/src/catalog\\.ts$" },
    },
    {
      // The primitives sit below the blocks (D-157): a block may use a primitive, never the other way.
      // Only the index barrel re-exports the blocks.
      name: "ui-primitives-do-not-import-blocks",
      severity: "error",
      from: {
        path: "^packages/ui/src/",
        pathNot: "^packages/ui/src/(blocks/|index\\.ts$)|\\.test\\.tsx?$",
      },
      to: { path: "^packages/ui/src/blocks/" },
    },
    {
      // Editors on an infinite surface sit above the design system (D-148): ui never imports them.
      name: "ui-does-not-import-editors",
      severity: "error",
      from: { path: "^packages/ui/" },
      to: { path: "^packages/(canvas|flow|draw|richtext)/" },
    },
    {
      // Canvas is the engine under flow and draw, never the other way.
      name: "canvas-does-not-import-its-editors",
      severity: "error",
      from: { path: "^packages/canvas/" },
      to: { path: "^packages/(flow|draw)/" },
    },
    {
      // Blueprint sits on canvas as an item kind and a layer (`@forgeron/blueprint/canvas`,
      // docs/blueprint/engine.md, P5), never the reverse: the canvas knows no scene engine.
      name: "canvas-does-not-import-blueprint",
      severity: "error",
      from: { path: "^packages/canvas/" },
      to: { path: "^packages/blueprint/" },
    },
    {
      // Blueprint's engine, format and layers (everything but `src/canvas/`) are what the site
      // ships: they import neither canvas nor ui, nor the integration on canvas.
      name: "blueprint-does-not-import-canvas-outside-its-canvas-layer",
      severity: "error",
      from: { path: "^packages/blueprint/src/(?!canvas/)" },
      to: { path: "^packages/(canvas|ui)/|^packages/blueprint/src/canvas/" },
    },
    {
      // The core of canvas is data and commands behind `CanvasEngine`, meant to be swappable for a
      // WebAssembly engine: no React, no view, no ui, no Node module.
      name: "canvas-core-is-framework-free",
      severity: "error",
      from: { path: "^packages/canvas/src/(core/|index\\.ts$)" },
      to: {
        path: "^packages/canvas/src/react/|^packages/ui/|(^|/)node_modules/(react|react-dom)/",
      },
    },
    {
      name: "canvas-core-stays-neutral",
      severity: "error",
      from: { path: "^packages/canvas/src/(core/|index\\.ts$)" },
      to: { dependencyTypes: ["core"] },
    },
    {
      // Flow sits on canvas and ui (D-148); it knows neither the whiteboard nor Blueprint.
      name: "flow-does-not-import-other-editors",
      severity: "error",
      from: { path: "^packages/flow/" },
      to: { path: "^packages/(draw|blueprint)/" },
    },
    {
      // The core of flow (the graph, the plugin host, the controller) and the core halves of its
      // plugins (rules, layout, run planning, groups, the clipboard: `src/plugins/*.ts`) are data
      // and pure functions on canvas's core: no React, no view, no editor half
      // (`src/plugins/editor/`), no ui, no Node module. Its React half is checked by
      // `scripts/flow-boundary.test.ts`, as dependency-cruiser does not follow `node_modules`.
      name: "flow-core-is-framework-free",
      severity: "error",
      from: { path: "^packages/flow/src/(core/|index\\.ts$|plugins/[^/]+\\.ts$)" },
      to: {
        path: "^packages/flow/src/(react|plugins/editor)/|^packages/canvas/src/react/|^packages/ui/|(^|/)node_modules/(react|react-dom)/",
      },
    },
    {
      name: "flow-core-stays-neutral",
      severity: "error",
      from: { path: "^packages/flow/src/(core/|index\\.ts$|plugins/[^/]+\\.ts$)" },
      to: { dependencyTypes: ["core"] },
    },
    {
      // Draw sits on canvas and ui (D-148); it knows neither flow nor Blueprint.
      name: "draw-does-not-import-other-editors",
      severity: "error",
      from: { path: "^packages/draw/" },
      to: { path: "^packages/(flow|blueprint)/" },
    },
    {
      // The core of draw (the plugin contract, the draw engine, the board's JSON, the SVG export,
      // and the core halves of the plugins in `src/plugins/*.ts`: the kinds, the arrows, the frames,
      // the pen) is data and pure functions on canvas's core: no React, no view, no ui, no editor
      // half (`src/plugins/editor/`), no Node module. The editor reads it, never the reverse.
      name: "draw-core-is-framework-free",
      severity: "error",
      from: { path: "^packages/draw/src/(core/|index\\.ts$|plugins/([^/]+\\.ts$|docs/))" },
      to: {
        path: "^packages/draw/src/(react|plugins/editor)/|^packages/canvas/src/react/|^packages/ui/|(^|/)node_modules/(react|react-dom)/",
      },
    },
    {
      name: "draw-core-stays-neutral",
      severity: "error",
      from: { path: "^packages/draw/src/(core/|index\\.ts$|plugins/([^/]+\\.ts$|docs/))" },
      to: { dependencyTypes: ["core"] },
    },
    {
      // The rich text editor is its own editor, on ProseMirror (Tiptap) and Yjs, not on canvas: it
      // knows none of the others.
      name: "richtext-does-not-import-other-editors",
      severity: "error",
      from: { path: "^packages/richtext/" },
      to: { path: "^packages/(canvas|flow|draw|blueprint)/" },
    },
    {
      // The core of richtext (the document as JSON, the plugin contract, the block catalog,
      // Markdown, plain text, the static renderer, and the core halves of the plugins in
      // `src/plugins/*.ts`) is data and pure functions: no React, no ProseMirror or Tiptap, no
      // Yjs, no ui, no layer above it, no editor half (`src/plugins/editor/`), no Node module. The
      // editor reads it, never the reverse.
      name: "richtext-core-is-framework-free",
      severity: "error",
      from: { path: "^packages/richtext/src/(core/|index\\.ts$|plugins/[^/]+\\.ts$)" },
      to: {
        path: "^packages/richtext/src/(react|tiptap|collab|plugins/editor)/|^packages/ui/|(^|/)node_modules/(react|react-dom|@tiptap/|prosemirror-|yjs/|y-protocols/|y-prosemirror/)",
      },
    },
    {
      name: "richtext-core-stays-neutral",
      severity: "error",
      from: { path: "^packages/richtext/src/(core/|index\\.ts$|plugins/[^/]+\\.ts$)" },
      to: { dependencyTypes: ["core"] },
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
      // `compose.ts` builds what each area is handed; an area that imported it would ask for the
      // whole gateway instead of the port it uses. Only the route table (and the tests) wire it.
      name: "gateway-compose-is-the-root",
      severity: "error",
      from: {
        path: "^apps/gateway/src/",
        pathNot: "^apps/gateway/src/(gateway\\.ts$|compose\\.ts$|.*\\.test\\.ts$)",
      },
      // The root file `compose.ts` (a case names a fixture ending in `compose.ts` instead).
      to: { path: "^apps/gateway/src/[^/]*compose\\.ts$" },
    },
    {
      // The admin MCP (D-079) acts through the platform's routes, called as the person, so the
      // console's guard and audit lines apply to it. It imports neither the registry nor any other
      // area of the gateway: `compose.ts` hands it a port.
      name: "admin-mcp-goes-through-the-platform",
      severity: "error",
      from: { path: "^apps/gateway/src/admin-mcp/", pathNot: "\\.test\\.ts$" },
      to: {
        path: "^(packages/registry/|apps/gateway/src/)",
        pathNot: "^apps/gateway/src/(admin-mcp|kernel)/",
      },
    },
    {
      // Identity renders pages and asks nothing of dispatch; dispatch and pages never import identity.
      name: "identity-is-below-dispatch-and-pages",
      severity: "error",
      from: { path: "^apps/gateway/src/(dispatch|pages)/", pathNot: "\\.test\\.ts$" },
      to: { path: "^apps/gateway/src/identity/" },
    },
    {
      // Inside identity: `authn` (who is calling: session, tokens, caller) is what `sign-in` and
      // `cli-login` and `mcp-oauth` build on, so it imports none of them; they do not import each other.
      name: "identity-authn-is-a-leaf",
      severity: "error",
      from: { path: "^apps/gateway/src/identity/authn/" },
      to: { path: "^apps/gateway/src/identity/(sign-in|cli-login|mcp-oauth)/" },
    },
    {
      name: "identity-sign-in-and-cli-login-are-apart",
      severity: "error",
      from: {
        path: "^apps/gateway/src/identity/(sign-in|cli-login|mcp-oauth)/",
        pathNot: "\\.test\\.ts$",
      },
      to: {
        path: "^apps/gateway/src/identity/(sign-in|cli-login|mcp-oauth)/",
        // The same folder is not "the other one": a file may import its siblings.
        pathNot: "^apps/gateway/src/identity/$1/",
      },
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
