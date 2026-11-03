import { ManifestSchema } from "@forgeron/manifest";
import { cp, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildTool, type BuildResult } from "./index";
import { findUnknownActions } from "./views";

const fixture = fileURLToPath(new URL("../fixtures/views", import.meta.url));

describe("findUnknownActions", () => {
  const manifest = { actions: { "deals.list": {} } } as never;

  it("reads the literal names given to useAction and useMutation", () => {
    const source = `useAction("deals.list", {}); useMutation<X>('deals.move'); useAction(\`a.b\`)`;
    expect(findUnknownActions(source, manifest)).toEqual([
      'cites the action "deals.move", which does not exist in this tool.',
      'cites the action "a.b", which does not exist in this tool.',
    ]);
  });

  it("ignores comments and names it cannot read", () => {
    const source = `// useAction("x.y")\n/* useMutation("x.z") */\nuseAction(name); useAction(\`a.\${b}\`)`;
    expect(findUnknownActions(source, manifest)).toEqual([]);
  });
});

describe("buildTool with views", () => {
  let result: BuildResult;
  const out = (file: string) => join(result.outDir, file);

  beforeAll(async () => {
    result = await buildTool(fixture);
  }, 60_000);

  it("writes each view as a static module, and the chunks they share", async () => {
    const files = await readdir(out("views"), { recursive: true });
    expect(files).toEqual(expect.arrayContaining(["pipeline.js", "board/index.js"]));
    const code = await readFile(out("views/pipeline.js"), "utf8");
    expect(code).toContain("deals.list");
    expect(code).not.toContain("process.env");
  });

  it("lists the views in the manifest, with their parameters and their module", async () => {
    const manifest = JSON.parse(await readFile(out("manifest.json"), "utf8"));
    expect(ManifestSchema.safeParse(manifest).success).toBe(true);
    expect(manifest.views).toMatchObject({
      pipeline: {
        title: "Pipeline",
        path: "/pipeline",
        access: "read",
        entry: "views/pipeline.js",
        params: { type: "object", properties: { owner: { type: "string" } } },
      },
      "board/index": { path: "/board", entry: "views/board/index.js" },
    });
  });

  it("records the hash of every view file", async () => {
    const { files } = JSON.parse(await readFile(out("build.json"), "utf8"));
    expect(Object.keys(files)).toEqual(
      expect.arrayContaining(["worker.js", "manifest.json", "views/pipeline.js"]),
    );
  });
});

describe("buildTool refuses a wrong view", () => {
  let copy: string;
  beforeAll(async () => {
    // Inside the package, so that the tool resolves `@forgeron/sdk` and React like the fixture does.
    copy = await mkdtemp(join(fixture, "..", ".views-"));
    await cp(fixture, copy, { recursive: true, filter: (src) => !src.includes(".forgeron") });
  });
  afterAll(() => rm(copy, { recursive: true, force: true }));

  const view = (path: string, body = "") =>
    `import { defineView${body ? ", useAction" : ""} } from "@forgeron/sdk/react";
export default defineView({ title: "X", path: ${JSON.stringify(path)}, access: "read", component() { ${body} return null; } });
`;

  it("when a view cites an action that does not exist", async () => {
    await writeFile(join(copy, "views", "bad.tsx"), view("/bad", `useAction("deals.nope", {});`));
    await expect(buildTool(copy)).rejects.toThrow(
      /views\/bad\.tsx cites the action "deals\.nope", which does not exist/,
    );
    await rm(join(copy, "views", "bad.tsx"));
  }, 60_000);

  it.each(["/mcp", "/api/x", "/cli", "/play", "/_f"])(
    "when its path is %s",
    async (path) => {
      await writeFile(join(copy, "views", "bad.tsx"), view(path));
      await expect(buildTool(copy)).rejects.toThrow(/reserved/);
      await rm(join(copy, "views", "bad.tsx"));
    },
    60_000,
  );

  it("when two views share a path", async () => {
    await writeFile(join(copy, "views", "twin.tsx"), view("/pipeline"));
    await expect(buildTool(copy)).rejects.toThrow(/already used/);
    await rm(join(copy, "views", "twin.tsx"));
  }, 60_000);
});
