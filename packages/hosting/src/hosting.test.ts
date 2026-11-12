import type { Manifest } from "@forgeron/manifest";
import { describe, expect, it } from "vitest";
import {
  assertDeployable,
  bindingsOf,
  ChangelogRefusal,
  environmentKey,
  type Build,
  type Environment,
} from "./index";

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

describe("assertDeployable", () => {
  const build = (changelog?: Build["changelog"]) =>
    ({ manifest: {}, worker: "", fingerprint: "x", ...(changelog ? { changelog } : {}) }) as Build;
  const env = (name: Environment["name"]): Environment => ({ tool: "crm", name });
  const entry = { entries: [{}], declared: "minor", detected: "minor" } as const;

  it("lets a preview and a local build through, whatever the changelog", () => {
    expect(() => assertDeployable(env("preview"), build())).not.toThrow();
    expect(() => assertDeployable(env("local"), build())).not.toThrow();
  });

  it("refuses a permanent channel a build that is not a release (D-125)", () => {
    expect(() => assertDeployable(env("production"), build())).toThrow(ChangelogRefusal);
    expect(() =>
      assertDeployable(
        env("production"),
        build({ entries: [], declared: "none", detected: "none" }),
      ),
    ).toThrow("takes only releases");
    // Changes still waiting in changes/: entries, but not a release.
    expect(() =>
      assertDeployable(
        { tool: "crm", name: "channel", channel: "staging" },
        build({ entries: [{}], declared: "patch", detected: "patch", released: false }),
      ),
    ).toThrow("The channel staging takes only releases");
    // A marketplace's publication is its release.
    expect(() => assertDeployable(env("production"), build(), { published: true })).not.toThrow();
    // A preview takes anything.
    expect(() =>
      assertDeployable({ tool: "crm", name: "preview", branch: "x" }, build()),
    ).not.toThrow();
  });

  it("refuses production when the declared impact is lower", () => {
    let refusal: unknown;
    try {
      assertDeployable(
        env("production"),
        build({ entries: [{}], declared: "patch", detected: "major" }),
      );
    } catch (error) {
      refusal = error;
    }
    expect(refusal).toMatchObject({ code: "IMPACT_TOO_LOW" });
  });

  it("accepts an entry that covers the change, or exceeds it", () => {
    expect(() => assertDeployable(env("production"), build(entry))).not.toThrow();
    expect(() =>
      assertDeployable(
        env("production"),
        build({ entries: [{}], declared: "major", detected: "patch" }),
      ),
    ).not.toThrow();
  });
});
