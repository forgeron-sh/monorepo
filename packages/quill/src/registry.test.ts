// The registry tells the truth: every skill and format it lists has its file, every file is listed,
// the skills' front matter matches, every relative link of every guide resolves, and this
// repository's own context (`.quill/`) has every file the skills read.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { QUILL } from "./index";

const ROOT = join(import.meta.dirname, "..");
const SKILLS = join(ROOT, "skills");
const FORMATS = join(SKILLS, "quill", "formats");

/** The `key: value` lines of a SKILL.md front matter. */
function frontMatter(file: string): Record<string, string> {
  const text = readFileSync(file, "utf8");
  const block = /^---\n([\s\S]*?)\n---\n/.exec(text)?.[1] ?? "";
  return Object.fromEntries(
    block
      .split("\n")
      .map((line) => /^([\w-]+):\s*(.*)$/.exec(line))
      .filter((m): m is RegExpExecArray => m !== null)
      .map((m) => [m[1]!, m[2]!]),
  );
}

/** Every Markdown file under a folder. */
function markdown(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return markdown(path);
    return name.endsWith(".md") ? [path] : [];
  });
}

describe("quill registry", () => {
  it("lists exactly the skills under skills/", () => {
    const folders = readdirSync(SKILLS).filter((n) => statSync(join(SKILLS, n)).isDirectory());
    expect(QUILL.skills.map((s) => s.name).sort()).toEqual(folders.sort());
  });

  it.each(QUILL.skills.map((s) => [s.name, s] as const))(
    "%s has a matching front matter",
    (name, skill) => {
      const fm = frontMatter(join(SKILLS, name, "SKILL.md"));
      expect(fm.name).toBe(name);
      expect(fm.description?.length ?? 0).toBeGreaterThan(40);
      expect(fm.description?.length ?? 0).toBeLessThanOrEqual(1024);
      expect(fm["disable-model-invocation"] === "true").toBe(skill.invocation === "user");
    },
  );

  it("lists exactly the formats under quill/formats/, each in the format table", () => {
    const files = readdirSync(FORMATS).map((f) => f.replace(/\.md$/, ""));
    expect(QUILL.formats.map((f) => f.id).sort()).toEqual(files.sort());
    const table = readFileSync(join(SKILLS, "quill", "SKILL.md"), "utf8");
    for (const f of QUILL.formats) expect(table).toContain(`| \`${f.id}\``);
  });

  it.each(QUILL.formats.map((f) => [f.id] as const))(
    "%s has a structure, a checklist and its sources",
    (id) => {
      const text = readFileSync(join(FORMATS, `${id}.md`), "utf8");
      expect(text).toMatch(/^## Structure$/m);
      expect(text).toMatch(/^## Checklist$/m);
      expect(text).toMatch(/- \[ \] /);
      expect(QUILL.formats.find((f) => f.id === id)?.inspiredBy.length).toBeGreaterThan(0);
    },
  );

  it("resolves every relative link of every guide", () => {
    const broken: string[] = [];
    for (const file of markdown(SKILLS)) {
      const text = readFileSync(file, "utf8");
      for (const m of text.matchAll(/\]\((?!https?:|#)([^)]+)\)/g)) {
        const target = resolve(dirname(file), m[1]!.split("#")[0]!);
        if (!existsSync(target)) broken.push(`${file.slice(ROOT.length)} → ${m[1]}`);
      }
    }
    expect(broken).toEqual([]);
  });

  it("has a template for every context file, and this repository has its own", () => {
    const templates = readdirSync(join(SKILLS, "quill-setup", "templates")).sort();
    expect([...QUILL.context].sort()).toEqual(templates);
    for (const name of QUILL.context)
      expect(existsSync(join(ROOT, "..", "..", ".quill", name))).toBe(true);
  });
});
