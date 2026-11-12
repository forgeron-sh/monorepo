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
    expect(result.stdout).toContain("FORGERON_TOKEN is not set and the workflow has no id-token");
  });

  it("deploys with GitHub Actions' identity when there is no token (D-123)", async () => {
    const ctx = await repository(["crm"]);
    const result = runScript(ctx, {
      ACTIONS_ID_TOKEN_REQUEST_URL: "https://token.example.test/?api-version=2.0",
      ACTIONS_ID_TOKEN_REQUEST_TOKEN: "runner-token",
    });
    expect(result.status).toBe(0);
    expect(await calls(ctx.log)).toEqual([
      "crm test token=none",
      "crm change check token=none",
      "crm deploy --env preview token=none",
    ]);
    const close = runScript(ctx, {
      FORGERON_CLOSE: "true",
      ACTIONS_ID_TOKEN_REQUEST_URL: "https://token.example.test/",
    });
    expect(close.status).toBe(0);
    expect((await calls(ctx.log)).at(-1)).toBe("crm preview close token=none");
  });

  it("installs the tool's dependencies before its tests: bun with a bun.lock, npm otherwise", async () => {
    const ctx = await repository(["crm", "odoo"]);
    const bin = join(ctx.root, "bin");
    await mkdir(bin);
    for (const tool of ["bun", "npm"]) {
      await writeFile(
        join(bin, tool),
        `#!/usr/bin/env bash
echo "$(basename "$PWD") ${tool} $*" >> "${ctx.log}"
`,
      );
      chmodSync(join(bin, tool), 0o755);
    }
    await writeFile(join(ctx.root, "crm", "package.json"), "{}");
    await writeFile(join(ctx.root, "crm", "bun.lock"), "");
    await writeFile(join(ctx.root, "odoo", "package.json"), "{}");
    await writeFile(join(ctx.root, "odoo", "package-lock.json"), "{}");
    const result = spawnSync("bash", [script, ctx.root], {
      env: {
        PATH: `${bin}:${process.env.PATH ?? ""}`,
        FORGERON_CMD: ctx.fake,
        FORGERON_TOKEN: "t",
      },
      encoding: "utf8",
    });
    expect(result.status).toBe(0);
    expect(await calls(ctx.log)).toEqual([
      "crm bun install --frozen-lockfile",
      "odoo npm ci",
      "crm test token=t",
      "crm change check token=t",
      "crm deploy --env preview token=t",
      "odoo test token=t",
      "odoo change check token=t",
      "odoo deploy --env preview token=t",
    ]);
    // Asked not to, it installs nothing.
    await writeFile(ctx.log, "");
    spawnSync("bash", [script, ctx.root], {
      env: {
        PATH: `${bin}:${process.env.PATH ?? ""}`,
        FORGERON_CMD: ctx.fake,
        FORGERON_INSTALL: "false",
      },
      encoding: "utf8",
    });
    expect((await calls(ctx.log)).some((c) => c.includes("install") || c.includes(" ci"))).toBe(
      false,
    );
  });

  it("runs the CLI of its own release by default", async () => {
    const ctx = await repository(["crm"]);
    const bin = join(ctx.root, "bin");
    await mkdir(bin);
    await writeFile(
      join(bin, "npx"),
      `#!/usr/bin/env bash
echo "npx $*" >> "${ctx.log}"
`,
    );
    chmodSync(join(bin, "npx"), 0o755);
    spawnSync("bash", [script, ctx.root], {
      env: { PATH: `${bin}:${process.env.PATH ?? ""}` },
      encoding: "utf8",
    });
    const { version } = JSON.parse(
      await readFile(new URL("../package.json", import.meta.url), "utf8"),
    ) as { version: string };
    expect((await calls(ctx.log))[0]).toBe(`npx --yes forgeron@${version} test`);
  });

  it("hands the address of every deployed tool to the action's output", async () => {
    const ctx = await repository(["crm", "dash"]);
    await writeFile(
      ctx.fake,
      `#!/usr/bin/env bash\n[ "$1" = deploy ] && echo "Deployed $(basename "$PWD")@1.0.0-preview.x+abc1234 to preview: https://acme.test/t/$(basename "$PWD")@x"\nexit 0\n`,
    );
    const output = join(ctx.root, "github-output");
    const result = runScript(ctx, { FORGERON_TOKEN: "t", GITHUB_OUTPUT: output });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("Deployed crm@");
    expect(await readFile(output, "utf8")).toBe(
      [
        "urls<<FORGERON_URLS_EOF",
        "crm https://acme.test/t/crm@x",
        "dash https://acme.test/t/dash@x",
        "FORGERON_URLS_EOF",
        "",
      ].join("\n"),
    );
  });

  it("closes the previews instead of deploying when asked, and does nothing without a token", async () => {
    const ctx = await repository(["crm"]);
    expect(runScript(ctx, { FORGERON_TOKEN: "t", FORGERON_CLOSE: "true" }).status).toBe(0);
    expect(await calls(ctx.log)).toEqual(["crm preview close token=t"]);
    const none = runScript(ctx, { FORGERON_CLOSE: "true" });
    expect(none.status).toBe(0);
    expect(none.stdout).toContain("was not closed");
    expect(await calls(ctx.log)).toEqual(["crm preview close token=t"]);
  });

  it("fails when a deploy fails, even with its output piped to the address collector", async () => {
    const ctx = await repository(["crm"]);
    const result = runScript(ctx, { FORGERON_TOKEN: "t", FAIL_ON: "deploy" });
    expect(result.status).not.toBe(0);
  });

  it("fails when there is no tool", async () => {
    const ctx = await repository([]);
    const result = runScript(ctx, { FORGERON_TOKEN: "t" });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("No tool found");
  });

  it("is an action that hands FORGERON_TOKEN and the endpoint to the script", async () => {
    const text = await readFile(action, "utf8");
    expect(text).toContain("FORGERON_TOKEN: ${{ inputs.token }}");
    expect(text).toContain("FORGERON_ENDPOINT: ${{ inputs.endpoint }}");
    expect(text).toContain("run.sh");
  });
});

describe("forgeron init", () => {
  it("writes the workflow that runs the action with GitHub's identity, no secret (D-123)", async () => {
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
    // The action of the release this CLI belongs to (0.0.0 from the sources).
    expect(workflow).toContain("uses: forgeron-sh/monorepo/.github/actions/deploy@v0.0.0");
    expect(workflow).toMatch(/permissions:\n {2}contents: read\n {2}id-token: write/);
    expect(workflow).not.toContain("secrets.");
    // Each pushed branch, and its deletion (D-121); tags are a marketplace's release, not a preview.
    expect(workflow).toMatch(/on:\n {2}push:\n {4}branches: \["\*\*"\]\n {2}delete:/);
  });
});
