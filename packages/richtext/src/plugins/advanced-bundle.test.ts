// What a page downloads: the static view needs none of the heavy libraries. The core halves are
// bundled the way an app would, and the output must hold no KaTeX, lowlight or highlight.js code;
// the editor halves must reach them only through dynamic imports (chunks of their own).
import { rolldown } from "rolldown";
import { describe, expect, it } from "vitest";

const here = (file: string) => decodeURIComponent(new URL(file, import.meta.url).pathname);

// Strings only the libraries contain (not our own identifiers or comments).
const KATEX = "KaTeX parse error";
const HLJS = "registerLanguage";

async function bundle(input: string) {
  // A stylesheet is a module of its own in the page's bundler; here it is left out.
  const css = {
    name: "css",
    load: (id: string) => (id.endsWith(".css") ? { code: "", moduleType: "js" as const } : null),
  };
  const build = await rolldown({ input, platform: "browser", logLevel: "silent", plugins: [css] });
  const { output } = await build.generate({ format: "esm", minify: false });
  await build.close();
  return output.flatMap((o) =>
    o.type === "chunk" ? [{ name: o.fileName, code: o.code, entry: o.isEntry }] : [],
  );
}

describe("the core halves", () => {
  it("bundle without KaTeX, lowlight or highlight.js", async () => {
    const chunks = await bundle(here("./advanced.ts"));
    expect(chunks).toHaveLength(1);
    const code = chunks[0]?.code ?? "";
    expect(code).toContain("createMath");
    expect(code).not.toContain(KATEX);
    expect(code).not.toContain(HLJS);
    expect(code).not.toMatch(/lowlight|highlight\.js|from "katex"/i);
  });

  it("stay small: the three of them are a few kilobytes", async () => {
    const chunks = await bundle(here("./advanced.ts"));
    expect((chunks[0]?.code.length ?? 0) < 60_000).toBe(true);
  });
});

describe("the editor halves", () => {
  it("fetch KaTeX and highlight.js only through dynamic imports", async () => {
    const chunks = await bundle(here("./editor/advanced.ts"));
    const entry = chunks.filter((c) => c.entry);
    expect(entry).toHaveLength(1);
    const main = entry[0]?.code ?? "";
    expect(main).not.toContain(KATEX);
    expect(main).not.toContain(HLJS);
    // The libraries are in chunks of their own.
    expect(chunks.some((c) => c.code.includes(KATEX))).toBe(true);
    expect(chunks.some((c) => c.code.includes(HLJS))).toBe(true);
    // One chunk per grammar (26), one for lowlight, one for KaTeX.
    expect(chunks.filter((c) => !c.entry).length).toBeGreaterThanOrEqual(28);
  });
});
