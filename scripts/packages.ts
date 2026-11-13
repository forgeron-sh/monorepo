// The packages Forgeron publishes on npm (D-086, D-122), in the order they are published: a package
// comes after the ones it depends on. They are released together, under one version.
//
// Each one is built by its own `tsdown.config.ts` into `dist/`; `bun scripts/pack.ts` then writes
// `dist/package.json`, the manifest npm receives: `exports` pointing at the built files, the workspace
// dependencies replaced by the released version. The workspace itself keeps resolving `src/`.

export interface Published {
  /** The folder of the workspace package. */
  dir: string;
  /** The name on npm, when it is not the workspace's (`forgeron` for the CLI). */
  name?: string;
  description: string;
  /** For the CLI: the command, and the built file it runs. */
  bin?: Record<string, string>;
}

export const PUBLISHED: Published[] = [
  {
    dir: "packages/permissions",
    description:
      "The Forgeron permissions engine: subjects, teams and atomic platform permissions.",
  },
  {
    dir: "packages/manifest",
    description: "The Forgeron manifest: its schema, and the comparison of two versions of a tool.",
  },
  {
    dir: "packages/runtime",
    description:
      "The runtime a Forgeron tool runs on: actions, access, database, the four interfaces.",
  },
  {
    dir: "packages/sdk",
    description: "Write a Forgeron tool: actions, database, views, connectors, and its tests.",
  },
  {
    dir: "apps/cli",
    name: "forgeron",
    description: "The Forgeron CLI: create, test, release and deploy tools.",
    // No leading "./": npm 11 removes such a bin when it publishes (forgeron@0.1.0 shipped without one).
    bin: { forgeron: "index.mjs" },
  },
];

export const REPOSITORY = "https://github.com/forgeron-sh/monorepo";
