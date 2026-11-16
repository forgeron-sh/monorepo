import { builtinModules } from "node:module";
import { fileURLToPath } from "node:url";
import { rolldown } from "rolldown";
import { describe, expect, it } from "vitest";

// Importing one icon bundles that icon and the renderer, not the catalog of 6,000 names.

const SRC = fileURLToPath(new URL(".", import.meta.url));

async function bundle(code: string): Promise<{ code: string; imports: string[] }> {
  const build = await rolldown({
    input: "entry",
    platform: "neutral",
    logLevel: "silent",
    external: ["react", "react/jsx-runtime", /^node:/, ...builtinModules],
    plugins: [
      {
        name: "entry",
        resolveId: (id) => (id === "entry" ? id : null),
        load: (id) => (id === "entry" ? code : null),
      },
    ],
  });
  const { output } = await build.generate({ format: "esm", minify: true });
  await build.close();
  const chunk = output[0];
  return { code: chunk.code, imports: [...chunk.imports] };
}

describe("tree shaking", () => {
  it("keeps one icon and drops the others", async () => {
    const { code, imports } = await bundle(
      `import { AnvilIcon, toSvg } from "${SRC}index.ts"; console.log(toSvg(AnvilIcon));`,
    );
    expect(code).toMatch(/[`"]anvil[`"]/);
    expect(code).not.toContain("abacus");
    expect(code).not.toContain("arrow-down-01");
    expect(code).not.toContain("implemented:!1");
    expect(code.length).toBeLessThan(4000);
    expect(imports).toEqual([]);
  }, 30_000);

  it("keeps the React component small and free of Node modules", async () => {
    const { code, imports } = await bundle(
      `import { Tick01Icon } from "${SRC}index.ts"; import { Icon } from "${SRC}react.tsx"; console.log(Icon, Tick01Icon);`,
    );
    expect(code).toMatch(/[`"]tick-01[`"]/);
    expect(code).not.toContain("anvil");
    expect(code.length).toBeLessThan(5000);
    expect(imports).toEqual(["react"]);
  }, 30_000);
});
