import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { run } from "./cli";
import type { Io } from "./io";

// `forgeron promote --from-branch` (D-113): the plan first, the promotion only when nothing stops it.

let server: Server;
let endpoint: string;
const requests: Array<{ path: string; body: Record<string, unknown> }> = [];
const answers = new Map<string, { status: number; body: unknown }>();

beforeAll(async () => {
  server = createServer((req, res) => {
    let raw = "";
    req.on("data", (chunk) => (raw += chunk));
    req.on("end", () => {
      requests.push({ path: String(req.url), body: JSON.parse(raw || "{}") });
      const answer = answers.get(String(req.url)) ?? { status: 404, body: {} };
      res.statusCode = answer.status;
      res.end(JSON.stringify(answer.body));
    });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  endpoint = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
afterAll(() => new Promise((resolve) => server.close(resolve)));

const dirs: string[] = [];
const savedConfig = process.env.XDG_CONFIG_HOME;
const savedToken = process.env.FORGERON_TOKEN;
afterEach(async () => {
  if (savedConfig === undefined) delete process.env.XDG_CONFIG_HOME;
  else process.env.XDG_CONFIG_HOME = savedConfig;
  if (savedToken === undefined) delete process.env.FORGERON_TOKEN;
  else process.env.FORGERON_TOKEN = savedToken;
  requests.length = 0;
  answers.clear();
  await Promise.all(dirs.splice(0).map((d) => rm(d, { recursive: true, force: true })));
});

async function setup() {
  const cwd = await mkdtemp(join(tmpdir(), "forgeron-plan-"));
  const config = await mkdtemp(join(tmpdir(), "forgeron-config-"));
  dirs.push(cwd, config);
  process.env.XDG_CONFIG_HOME = config;
  delete process.env.FORGERON_TOKEN;
  await mkdir(join(cwd, ".forgeron"));
  await writeFile(
    join(cwd, ".forgeron", "project.json"),
    JSON.stringify({ tool: "crm", workspace: "acme", endpoint }),
  );
  await mkdir(join(config, "forgeron"));
  await writeFile(join(config, "forgeron", "credentials"), "person-token\n");
  const logs: string[] = [];
  const errors: string[] = [];
  const io: Io = {
    cwd,
    log: (m) => void logs.push(m),
    error: (m) => void errors.push(m),
    exec: async () => 0,
    stopped: new Promise(() => {}),
  };
  return { io, logs, errors, cwd };
}

const goodPlan = {
  tool: "crm",
  version: "1.2.0",
  from: { branch: "feat" },
  to: { environment: "production", currentVersion: "1.0.0" },
  alreadyServed: false,
  ok: true,
  conflicts: [],
  requiresAllowDestructive: false,
  migrations: { checked: true, applied: ["0001_init"], pending: ["0002_stage"], destructive: [] },
  changes: [{ kind: "action.added", subject: "actions.deals.move", impact: "minor" }],
  impact: "minor",
};
const blockedPlan = {
  ...goodPlan,
  ok: false,
  conflicts: [
    {
      code: "MIGRATION_MISSING",
      subject: "0002_other",
      message: "The migration 0002_other was applied, but this build does not have it.",
    },
  ],
  prompt: "I want to promote the Forgeron tool crm ... MIGRATION_MISSING (0002_other) ...",
};

describe("forgeron promote --from-branch", () => {
  it("asks for the plan, then promotes what the branch serves when nothing stops it", async () => {
    const { io, logs, errors } = await setup();
    answers.set("/promote/plan", { status: 200, body: goodPlan });
    answers.set("/promote", {
      status: 200,
      body: { tool: "crm", version: "1.2.0", environment: "production", applied: ["0002_stage"] },
    });
    expect(await run(["promote", "--from-branch", "feat", "--to", "production"], io)).toBe(0);
    expect(requests.map((r) => r.path)).toEqual(["/promote/plan", "/promote"]);
    expect(requests[0]!.body).toEqual({ tool: "crm", fromBranch: "feat", to: "production" });
    expect(requests[1]!.body).toEqual({ tool: "crm", fromBranch: "feat", to: "production" });
    const out = logs.join("\n");
    expect(out).toContain("crm@1.2.0 can go to production (it serves 1.0.0).");
    expect(out).toContain("Migrations to apply: 0002_stage");
    expect(out).toContain("actions.deals.move");
    expect(out).toContain("Promoted crm@1.2.0 to production");
    expect(errors).toEqual([]);
  });

  it("prints each conflict, the way out and the prompt, exits 3, and promotes nothing", async () => {
    const { io, errors } = await setup();
    answers.set("/promote/plan", { status: 200, body: blockedPlan });
    expect(await run(["promote", "--from-branch", "feat", "--to", "production"], io)).toBe(3);
    expect(requests.map((r) => r.path)).toEqual(["/promote/plan"]);
    const out = errors.join("\n");
    expect(out).toContain("crm@1.2.0 cannot go to production yet: 1 problem.");
    expect(out).toContain("MIGRATION_MISSING (0002_other)");
    expect(out).toContain("forgeron db status --env production");
    expect(out).toContain("hand them to an agent");
    expect(out).toContain("----- prompt -----");
    expect(out).toContain(blockedPlan.prompt);
  });

  it("can write the prompt to a file", async () => {
    const { io, logs, cwd } = await setup();
    answers.set("/promote/plan", { status: 200, body: blockedPlan });
    expect(
      await run(
        ["promote", "--from-branch", "feat", "--to", "production", "--prompt-file", "prompt.txt"],
        io,
      ),
    ).toBe(3);
    expect(await readFile(join(cwd, "prompt.txt"), "utf8")).toBe(`${blockedPlan.prompt}\n`);
    expect(logs.join("\n")).toContain("The prompt was written to");
  });

  it("only looks with --dry-run, and says when the target already serves it", async () => {
    const { io, logs } = await setup();
    answers.set("/promote/plan", { status: 200, body: goodPlan });
    expect(
      await run(["promote", "--from-branch", "feat", "--to", "production", "--dry-run"], io),
    ).toBe(0);
    expect(requests.map((r) => r.path)).toEqual(["/promote/plan"]);
    answers.set("/promote/plan", { status: 200, body: { ...goodPlan, alreadyServed: true } });
    logs.length = 0;
    await run(["promote", "--from-branch", "feat", "--to", "production"], io);
    expect(logs.join("\n")).toContain("already serves crm@1.2.0");
    expect(requests.map((r) => r.path)).not.toContain("/promote");
  });

  it("asks for --allow-destructive instead of dropping data on its own", async () => {
    const { io, errors } = await setup();
    answers.set("/promote/plan", {
      status: 200,
      body: {
        ...goodPlan,
        requiresAllowDestructive: true,
        migrations: { ...goodPlan.migrations, destructive: ["0002_stage"] },
      },
    });
    expect(await run(["promote", "--from-branch", "feat", "--to", "production"], io)).toBe(1);
    expect(errors.join("\n")).toContain("--allow-destructive");
    expect(requests.map((r) => r.path)).toEqual(["/promote/plan"]);
    // With the flag it goes on.
    answers.set("/promote", { status: 200, body: { tool: "crm", version: "1.2.0" } });
    expect(
      await run(
        ["promote", "--from-branch", "feat", "--to", "production", "--allow-destructive"],
        io,
      ),
    ).toBe(0);
    expect(requests.at(-1)!.body).toMatchObject({ allowDestructive: true, fromBranch: "feat" });
  });

  it("refuses a version together with a branch, or neither, and says what the workspace said", async () => {
    const { io, errors } = await setup();
    expect(await run(["promote", "1.0.0", "--from-branch", "feat", "--to", "production"], io)).toBe(
      2,
    );
    expect(await run(["promote", "--to", "production"], io)).toBe(2);
    answers.set("/promote/plan", {
      status: 404,
      body: { error: { code: "NOT_FOUND", message: "The branch ghost has no preview." } },
    });
    expect(await run(["promote", "--from-branch", "ghost", "--to", "production"], io)).toBe(1);
    expect(errors.join("\n")).toContain("The branch ghost has no preview.");
  });

  it("keeps promoting by version number as before, without a plan", async () => {
    const { io } = await setup();
    answers.set("/promote", { status: 200, body: { tool: "crm", version: "1.1.0" } });
    expect(await run(["promote", "1.1.0", "--to", "production"], io)).toBe(0);
    expect(requests.map((r) => r.path)).toEqual(["/promote"]);
  });
});
