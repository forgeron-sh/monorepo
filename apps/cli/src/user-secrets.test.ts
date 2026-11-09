import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { run } from "./cli";
import type { Io } from "./io";

// A person's own secrets are given on the web (D-102): `forgeron secrets set --user` prints the link
// to the tool's setup page and reads nothing, sends nothing.

const dirs: string[] = [];
afterEach(async () => {
  vi.unstubAllGlobals();
  await Promise.all(dirs.splice(0).map((d) => rm(d, { recursive: true, force: true })));
});

async function setup(endpoint = "https://acme.forgeron.app") {
  const cwd = await mkdtemp(join(tmpdir(), "forgeron-usersecrets-"));
  dirs.push(cwd);
  await mkdir(join(cwd, ".forgeron"));
  await writeFile(
    join(cwd, ".forgeron", "project.json"),
    JSON.stringify({ tool: "crm", workspace: "acme", endpoint }),
  );
  const errors: string[] = [];
  const readSecret = vi.fn<() => Promise<string>>(async () => "never-asked");
  const io: Io = {
    cwd,
    log: () => {},
    error: (m) => void errors.push(m),
    exec: async () => 0,
    readSecret,
    stopped: new Promise(() => {}),
  };
  return { io, errors, readSecret };
}

describe("forgeron secrets set --user", () => {
  it("prints the link to the tool's setup page, asks for nothing and sends nothing", async () => {
    const fetched = vi.fn<() => void>();
    vi.stubGlobal("fetch", fetched);
    const { io, errors, readSecret } = await setup();
    expect(await run(["secrets", "set", "ODOO_API_KEY", "--user"], io)).toBe(2);
    expect(errors.join("\n")).toContain("https://acme.forgeron.app/t/crm/setup");
    expect(readSecret).not.toHaveBeenCalled();
    expect(fetched).not.toHaveBeenCalled();
  });

  it("keeps a trailing slash of the endpoint out of the link", async () => {
    const { io, errors } = await setup("https://acme.forgeron.app/");
    await run(["secrets", "set", "K", "--user"], io);
    expect(errors.join("\n")).toContain("https://acme.forgeron.app/t/crm/setup");
    expect(errors.join("\n")).not.toContain("app//t/");
  });

  it("still refuses --user on a command that is not `secrets set <NAME>`", async () => {
    const { io, errors } = await setup();
    expect(await run(["secrets", "list", "--user"], io)).toBe(2);
    expect(errors.join("\n")).toContain("--user goes with");
  });
});
