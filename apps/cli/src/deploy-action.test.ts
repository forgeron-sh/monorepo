import { spawnSync } from "node:child_process";
import { chmodSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { run } from "./cli";
import type { Io } from "./io";

const script = fileURLToPath(new URL("../../../.github/actions/deploy/run.sh", import.meta.url));
const action = fileURLToPath(
  new URL("../../../.github/actions/deploy/action.yml", import.meta.url),
);

const dirs: string[] = [];
afterEach(async () => {
  await Promise.all(dirs.splice(0).map((d) => rm(d, { recursive: true, force: true })));
});

/** A repository with these tools, and a fake `forgeron` that logs where and how it is called. */
async function repository(tools: string[]) {
  const root = await mkdtemp(join(tmpdir(), "forgeron-action-"));
  dirs.push(root);
  for (const tool of tools) {
    await mkdir(join(root, tool), { recursive: true });
    await writeFile(join(root, tool, "forgeron.config.ts"), "");
  }
  // Not tools: dependencies and build output hold copies of a config.
  await mkdir(join(root, "node_modules", "dep"), { recursive: true });
  await writeFile(join(root, "node_modules", "dep", "forgeron.config.ts"), "");
  await mkdir(join(root, "crm", ".forgeron", "build"), { recursive: true });
  await writeFile(join(root, "crm", ".forgeron", "build", "forgeron.config.ts"), "");

  const log = join(root, "calls.log");
  const fake = join(root, "fake-forgeron");
  await writeFile(
    fake,
    `#!/usr/bin/env bash\necho "$(basename "$PWD") $* token=\${FORGERON_TOKEN:-none}" >> "${log}"\n[ "\${FAIL_ON:-}" = "$1" ] && exit 1 || exit 0\n`,
  );
  chmodSync(fake, 0o755);
  return { root, log, fake };
}

function runScript(ctx: { root: string; fake: string }, env: Record<string, string> = {}) {
  return spawnSync("bash", [script, ctx.root], {
    env: { PATH: process.env.PATH ?? "", FORGERON_CMD: ctx.fake, ...env },
    encoding: "utf8",
  });
}
const calls = async (log: string) => (await readFile(log, "utf8")).trim().split("\n");

describe("the deploy action", () => {
  it("finds every tool and runs test, change check and deploy for each, in order", async () => {
    const ctx = await repository(["crm", "apps/odoo"]);
    const result = runScript(ctx, { FORGERON_TOKEN: "t0ken" });
    expect(result.status).toBe(0);
    expect(await calls(ctx.log)).toEqual([
      "odoo test token=t0ken",
      "odoo change check token=t0ken",
      "odoo deploy --env preview token=t0ken",
      "crm test token=t0ken",
      "crm change check token=t0ken",
      "crm deploy --env preview token=t0ken",
    ]);
  });

  it("deploys to the environment asked, with extra arguments", async () => {
    const ctx = await repository(["crm"]);
    runScript(ctx, {
      FORGERON_TOKEN: "t",
      FORGERON_ENV: "production",
      FORGERON_ARGS: "--allow-destructive",
    });
    expect((await calls(ctx.log)).at(-1)).toBe(
      "crm deploy --env production --allow-destructive token=t",
    );
  });

  it("stops at the first failing step: a tool that fails its tests is not deployed", async () => {
    const ctx = await repository(["crm"]);
    const result = runScript(ctx, { FORGERON_TOKEN: "t", FAIL_ON: "change" });
    expect(result.status).not.toBe(0);
    expect(await calls(ctx.log)).toEqual(["crm test token=t", "crm change check token=t"]);
  });

  it("tests and checks, but does not deploy, without FORGERON_TOKEN", async () => {
    const ctx = await repository(["crm"]);
    const result = runScript(ctx);
    expect(result.status).toBe(0);
    expect(await calls(ctx.log)).toEqual(["crm test token=none", "crm change check token=none"]);
    expect(result.stdout).toContain("FORGERON_TOKEN is not set");
  });

  it("fails when there is no tool", async () => {
    const ctx = await repository([]);
    const result = runScript(ctx, { FORGERON_TOKEN: "t" });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("No tool found");
  });

  it("is an action that hands FORGERON_TOKEN to the script", async () => {
    const text = await readFile(action, "utf8");
    expect(text).toContain("FORGERON_TOKEN: ${{ inputs.token }}");
    expect(text).toContain("run.sh");
  });
});

describe("forgeron init", () => {
  it("writes the workflow that runs the action with FORGERON_TOKEN", async () => {
    const root = await mkdtemp(join(tmpdir(), "forgeron-init-"));
    dirs.push(root);
    const io: Io = {
      cwd: root,
      log: () => {},
      error: () => {},
      exec: async () => 0,
      stopped: new Promise(() => {}),
    };
    expect(await run(["init", "my-tool"], io)).toBe(0);
    const workflow = await readFile(
      join(root, "my-tool", ".github", "workflows", "forgeron.yml"),
      "utf8",
    );
    expect(workflow).toContain("uses: forgeron/deploy-action@v1");
    expect(workflow).toContain("token: ${{ secrets.FORGERON_TOKEN }}");
    expect(workflow).toMatch(/on:\n {2}push:\n {2}pull_request:/);
  });
});
