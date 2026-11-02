import { spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

const build = fileURLToPath(new URL("./build.mjs", import.meta.url));
const committed = fileURLToPath(new URL(".", import.meta.url));

const run = (args: string[], dir?: string) =>
  spawnSync("node", [build, ...args], {
    encoding: "utf8",
    env: { ...process.env, ...(dir ? { TOKENS_DIR: dir } : {}) },
  });

const dirs: string[] = [];
const copyOfCommitted = () => {
  const dir = mkdtempSync(join(tmpdir(), "forgeron-tokens-"));
  dirs.push(dir);
  cpSync(join(committed, "tokens.css"), join(dir, "tokens.css"));
  cpSync(join(committed, "fonts"), join(dir, "fonts"), { recursive: true });
  return dir;
};
afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe("tokens.css", () => {
  it("is what assets/design-system/tokens.json generates", () => {
    const result = run(["--check"]);
    expect(result.stderr).toBe("");
    expect(result.status).toBe(0);
  });

  it("fails when the committed file is stale, and says how to fix it", () => {
    const dir = copyOfCommitted();
    writeFileSync(
      join(dir, "tokens.css"),
      `${readFileSync(join(dir, "tokens.css"), "utf8")}/* stale */\n`,
    );
    const result = run(["--check"], dir);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("tokens.css");
    expect(result.stderr).toContain("bun run tokens");
  });

  it("fails when a font is missing", () => {
    const dir = copyOfCommitted();
    rmSync(join(dir, "fonts"), { recursive: true });
    const result = run(["--check"], dir);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("fonts/");
  });

  it("does not write anything in check mode", () => {
    const dir = copyOfCommitted();
    rmSync(join(dir, "tokens.css"));
    run(["--check"], dir);
    expect(() => readFileSync(join(dir, "tokens.css"))).toThrow(/ENOENT/);
  });
});
