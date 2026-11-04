// Builds the gateway into one ES module: `bun run --cwd apps/gateway build` writes `dist/worker.js`,
// the file `forgeron platform install --gateway` uploads (docs/DECISIONS.md, D-028).
import { rolldown } from "rolldown";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

/** The runtime's own modules: the Workers runtime provides `node:*` with `nodejs_compat`. */
const NODE_BUILTIN = /^node:/;

export async function buildGateway(file = join(here, "..", "dist", "worker.js")): Promise<string> {
  const target = resolve(file);
  const bundle = await rolldown({
    input: join(here, "..", "src", "worker.ts"),
    platform: "neutral",
    external: NODE_BUILTIN,
    resolve: {
      conditionNames: ["workerd", "worker", "browser", "import", "default"],
      // Some packages (`@asteasolutions/zod-to-openapi`, under `@hono/zod-openapi`) have `module`
      // and `main` but no `exports`: with `platform: "neutral"` Rolldown reads neither and leaves
      // the import external, which workerd then cannot load (`bundle.test.ts` catches it).
      mainFields: ["module", "main"],
    },
    logLevel: "silent",
  });
  await bundle.write({ file: target, format: "esm", codeSplitting: false });
  await bundle.close();
  return target;
}

if (import.meta.main) {
  console.log(`Gateway bundle written to ${await buildGateway()}`);
}
