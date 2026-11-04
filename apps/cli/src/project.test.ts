import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";
import { resolveEndpoint, writeProject } from "./project";

const dirs: string[] = [];
afterEach(async () => {
  await Promise.all(dirs.splice(0).map((d) => rm(d, { recursive: true, force: true })));
});

async function folder(project?: Parameters<typeof writeProject>[1]) {
  const dir = await mkdtemp(`${tmpdir()}/forgeron-project-`);
  dirs.push(dir);
  if (project) await writeProject(dir, project);
  return dir;
}

const linked = { tool: "crm", workspace: "demo", endpoint: "https://demo.fabriks.cc" };

describe("resolveEndpoint", () => {
  it("takes --endpoint before the project file", async () => {
    const dir = await folder(linked);
    expect(await resolveEndpoint({ endpoint: "https://other.test" }, dir)).toBe(
      "https://other.test",
    );
  });

  it("takes the project file's endpoint, with or without the linked --workspace", async () => {
    const dir = await folder(linked);
    expect(await resolveEndpoint({}, dir)).toBe("https://demo.fabriks.cc");
    expect(await resolveEndpoint({ workspace: "demo" }, dir)).toBe("https://demo.fabriks.cc");
  });

  it("falls back to the default of a --workspace the project is not linked to", async () => {
    const dir = await folder(linked);
    expect(await resolveEndpoint({ workspace: "acme" }, dir)).toBe("https://acme.forgeron.app");
    expect(await resolveEndpoint({ workspace: "acme" }, await folder())).toBe(
      "https://acme.forgeron.app",
    );
  });

  it("is a wrong use with nothing to go on, or with a reserved workspace", async () => {
    await expect(resolveEndpoint({}, await folder())).rejects.toThrow("No workspace");
    await expect(resolveEndpoint({ workspace: "www" }, await folder())).rejects.toThrow("reserved");
  });
});
