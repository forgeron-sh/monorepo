import type { Manifest } from "@forgeron/manifest";
import { describe, expect, it } from "vitest";
import { bindingsOf, environmentKey } from "./index";

const manifest = (resources: Manifest["resources"]) => ({ resources }) as Manifest;

describe("bindingsOf", () => {
  it("gives a tool without resources no binding", () => {
    expect(bindingsOf(manifest({}))).toEqual([]);
  });

  it("turns each declared resource into a binding of its kind", () => {
    const resources = {
      db: { engine: "d1" as const },
      cache: {},
      files: { maxSize: "25MB", types: ["image/*"] },
      queue: {},
    };
    expect(bindingsOf(manifest(resources))).toEqual([
      { name: "DB", kind: "d1" },
      { name: "CACHE", kind: "kv" },
      { name: "FILES", kind: "r2" },
      { name: "QUEUE", kind: "queue" },
    ]);
  });

  it("does not bind what is not a Cloudflare resource", () => {
    const resources = { secrets: { A: {} }, network: { allow: ["a.test"], why: "x" } };
    expect(bindingsOf(manifest(resources))).toEqual([]);
  });
});

describe("environmentKey", () => {
  it("names a tool in an environment, with the branch of a preview", () => {
    expect(environmentKey({ tool: "crm", name: "production" })).toBe("crm:production");
    expect(environmentKey({ tool: "crm", name: "preview", branch: "feat-x" })).toBe(
      "crm:preview:feat-x",
    );
  });
});
