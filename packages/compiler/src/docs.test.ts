import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildTool } from "./build";
import { collectDocs, docsEntry, imageReferences, MAX_FILE, svgProblem } from "./docs";

const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);

describe("imageReferences", () => {
  it("reads markdown and html images, relative ones only, outside code blocks", () => {
    const md = [
      "![a](docs/a.png) ![b](<docs/b c.png> 'title') ![ext](https://x.dev/e.png)",
      '<img src="./docs/c.gif" width="10"> <img alt="x" src=\'docs/d.webp\'>',
      "```",
      "![code](docs/code.png)",
      "```",
      "![data](data:image/png;base64,AAAA)",
    ].join("\n");
    expect(imageReferences(md)).toEqual([
      "docs/a.png",
      "docs/b c.png",
      "./docs/c.gif",
      "docs/d.webp",
    ]);
  });
});

describe("svgProblem", () => {
  it.each([
    ["<svg><script>alert(1)</script></svg>", "script"],
    ['<svg onload="x()"></svg>', "event handler"],
    ['<svg><a href="https://x.dev"><rect/></a></svg>', "external"],
    ['<svg><image xlink:href="data:image/png;base64,AA"/></svg>', "external"],
    ["<svg><style>@import url(x.css);</style></svg>", "imports"],
    ['<svg><rect fill="url(https://x.dev/a)"/></svg>', "external"],
    ["<svg><foreignObject/></svg>", "run or load"],
  ])("refuses %s", (svg, reason) => {
    expect(svgProblem(svg)).toContain(reason);
  });

  it("accepts a plain drawing, with local references", () => {
    expect(
      svgProblem(
        '<svg xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g"/></defs><use href="#g"/><rect fill="url(#g)" style="fill:red"/></svg>',
      ),
    ).toBeUndefined();
  });
});

describe("collectDocs", () => {
  let dir: string;
  let outside: string;
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "forgeron-docs-"));
    outside = await mkdtemp(join(tmpdir(), "forgeron-outside-"));
    await mkdir(join(dir, "docs"));
    await writeFile(join(dir, "docs", "a.png"), PNG);
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
    await rm(outside, { recursive: true, force: true });
  });

  it("collects the README, each image once, and the icon", async () => {
    await writeFile(join(dir, "README.md"), "![a](docs/a.png)\n<img src='./docs/a.png'>");
    const svg = "<svg xmlns='http://www.w3.org/2000/svg'/>";
    await writeFile(join(dir, "docs", "i.svg"), svg);
    const docs = await collectDocs(dir, "./docs/i.svg");
    expect(docs.readme).toContain("![a]");
    expect(docs.icon).toBe("docs/i.svg");
    expect(docs.assets.map((a) => [a.path, a.type, a.size])).toEqual([
      ["docs/a.png", "image/png", PNG.length],
      ["docs/i.svg", "image/svg+xml", svg.length],
    ]);
    expect(docs.assets[0]!.hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("collects the guide and its images apart from the README (D-115)", async () => {
    await writeFile(join(dir, "README.md"), "# Technical");
    await writeFile(join(dir, "GUIDE.md"), "# For you\n![a](docs/a.png)");
    const docs = await collectDocs(dir);
    expect(docs.readme).toBe("# Technical");
    expect(docs.guide).toBe("# For you\n![a](docs/a.png)");
    expect(docs.assets.map((a) => a.path)).toEqual(["docs/a.png"]);
    const entry = docsEntry(docs)!;
    expect(entry.guide).toEqual({
      size: docs.guide!.length,
      hash: expect.stringMatching(/^[0-9a-f]{64}$/),
    });
  });

  it("names the guide when one of its images is refused", async () => {
    await writeFile(join(dir, "GUIDE.md"), "![x](../x.png)");
    await expect(collectDocs(dir)).rejects.toThrow(
      /GUIDE\.md: "\.\.\/x\.png" leaves the tool folder/,
    );
  });

  it("has nothing for a tool without README", async () => {
    expect(await collectDocs(dir)).toEqual({ assets: [] });
  });

  it("refuses a path that leaves the folder, however it is written", async () => {
    await writeFile(join(outside, "x.png"), PNG);
    for (const reference of [
      "../x.png",
      "docs/../../x.png",
      "/etc/x.png",
      "docs%2F..%2F..%2Fx.png",
    ]) {
      await writeFile(join(dir, "README.md"), `![x](${reference})`);
      await expect(collectDocs(dir)).rejects.toThrow(/leaves the tool folder|relative path/);
    }
  });

  it("refuses a symlink that leaves the folder", async () => {
    await writeFile(join(outside, "secret.png"), PNG);
    await symlink(join(outside, "secret.png"), join(dir, "docs", "link.png"));
    await writeFile(join(dir, "README.md"), "![x](docs/link.png)");
    await expect(collectDocs(dir)).rejects.toThrow(/docs\/link\.png.*link that leaves/);
  });

  it("names the file in each refusal", async () => {
    await writeFile(join(dir, "README.md"), "![x](docs/missing.png)");
    await expect(collectDocs(dir)).rejects.toThrow(
      'README.md: the file "docs/missing.png" does not exist',
    );

    await writeFile(join(dir, "docs", "a.bmp"), PNG);
    await writeFile(join(dir, "README.md"), "![x](docs/a.bmp)");
    await expect(collectDocs(dir)).rejects.toThrow(
      /docs\/a\.bmp: README\.md references it, but only/,
    );

    await writeFile(join(dir, "docs", "fake.png"), "not a png");
    await writeFile(join(dir, "README.md"), "![x](docs/fake.png)");
    await expect(collectDocs(dir)).rejects.toThrow(
      "docs/fake.png: the content is not a .png image",
    );

    await writeFile(join(dir, "docs", "evil.svg"), "<svg><script/></svg>");
    await writeFile(join(dir, "README.md"), "![x](docs/evil.svg)");
    await expect(collectDocs(dir)).rejects.toThrow("docs/evil.svg: this SVG is refused");
  });

  it("limits a file to 1 MB and the whole to 5 MB", async () => {
    await writeFile(join(dir, "docs", "big.png"), Buffer.concat([PNG, Buffer.alloc(MAX_FILE)]));
    await writeFile(join(dir, "README.md"), "![x](docs/big.png)");
    await expect(collectDocs(dir)).rejects.toThrow(/docs\/big\.png: \d+ bytes, over the limit/);

    const refs: string[] = [];
    for (let i = 0; i < 6; i++) {
      await writeFile(
        join(dir, "docs", `f${i}.png`),
        Buffer.concat([PNG, Buffer.alloc(MAX_FILE - 1000)]),
      );
      refs.push(`![x](docs/f${i}.png)`);
    }
    await writeFile(join(dir, "README.md"), refs.join("\n"));
    await expect(collectDocs(dir)).rejects.toThrow(/docs\/f5\.png: the documentation .* in total/);
  });

  it("wants an icon that is a svg or a png", async () => {
    await writeFile(join(dir, "docs", "i.gif"), "GIF89a");
    await expect(collectDocs(dir, "docs/i.gif")).rejects.toThrow("must be a .svg or a .png");
  });
});

describe("buildTool with a README", () => {
  it("keeps the hashes in the manifest and the content in docs.json", async () => {
    const built = await buildTool(fileURLToPath(new URL("../fixtures/docs-tool", import.meta.url)));
    const out = (f: string) => readFile(join(built.outDir, f), "utf8");
    const manifest = JSON.parse(await out("manifest.json"));
    const docs = JSON.parse(await out("docs.json"));
    expect(manifest.icon).toBe("docs/icon.svg");
    expect(manifest.docs.readme.size).toBe(Buffer.byteLength(docs.readme));
    expect(manifest.docs.assets.map((a: { path: string }) => a.path)).toEqual([
      "docs/screen.png",
      "docs/icon.svg",
    ]);
    expect(JSON.stringify(manifest)).not.toContain("base64");
    expect(JSON.parse(await out("build.json")).files["docs.json"]).toMatch(/^[0-9a-f]{64}$/);
  }, 60_000);
});
