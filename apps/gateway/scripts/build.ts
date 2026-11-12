// Builds the gateway into one ES module: `bun run --cwd apps/gateway build` writes `dist/worker.js`,
// the file `forgeron platform install --gateway` uploads (docs/DECISIONS.md, D-028). The release and
// the commit it is built from are written in (D-123): the console shows them, and a tool the gateway
// creates depends on the SDK of that release.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { rolldown } from "rolldown";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

/** The platform's release: the root package.json, whose number every published package shares (D-122). */
const version = () =>
  (
    JSON.parse(readFileSync(join(here, "..", "..", "..", "package.json"), "utf8")) as {
      version: string;
    }
  ).version;

/** The commit: CI's (`GITHUB_SHA`), else the checkout's, else none. */
function commit(): string {
  if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA;
  try {
    return execFileSync("git", ["rev-parse", "HEAD"], { cwd: here, encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

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
    transform: {
      define: {
        __FORGERON_GATEWAY_VERSION__: JSON.stringify(version()),
        __FORGERON_GATEWAY_COMMIT__: JSON.stringify(commit()),
      },
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
