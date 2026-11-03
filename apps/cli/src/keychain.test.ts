import { describe, expect, it } from "vitest";
import { macKeychain, secretToolKeychain, systemKeychain, type Runner } from "./keychain";

const SECRET = "fgt.abc_DEF-123";

/** A runner that records every call and answers with `answer`. */
function fake(answer: { code?: number; stdout?: string } = {}) {
  const calls: Array<{ command: string; args: string[]; input?: string }> = [];
  const run: Runner = async (command, args, input) => {
    calls.push({ command, args, ...(input === undefined ? {} : { input }) });
    return { code: answer.code ?? 0, stdout: answer.stdout ?? "" };
  };
  return { calls, run };
}

describe("macOS keychain", () => {
  it("stores the token on standard input, never as an argument", async () => {
    const { calls, run } = fake();
    await macKeychain(run).set("forgeron", SECRET);
    expect(calls).toHaveLength(1);
    expect(calls[0]!.command).toBe("security");
    expect(calls[0]!.args).toEqual(["-i"]);
    expect(calls[0]!.input).toContain(`-w "${SECRET}"`);
    expect(JSON.stringify(calls[0]!.args)).not.toContain(SECRET);
  });

  it("reads the token and treats a missing entry as none", async () => {
    expect(await macKeychain(fake({ stdout: `${SECRET}\n` }).run).get("forgeron")).toBe(SECRET);
    expect(await macKeychain(fake({ code: 44 }).run).get("forgeron")).toBeUndefined();
  });

  it("fails when the keychain refuses, and forgets without failing", async () => {
    await expect(macKeychain(fake({ code: 1 }).run).set("forgeron", SECRET)).rejects.toThrow(
      /failed \(exit 1\)/,
    );
    const { calls, run } = fake({ code: 44 });
    await macKeychain(run).delete("forgeron");
    expect(calls[0]!.args).toEqual(["delete-generic-password", "-s", "forgeron", "-a", "forgeron"]);
  });

  it("refuses a token it cannot hand over safely, without leaking it in the error", async () => {
    const { calls, run } = fake();
    const bad = 'a"b\nadd-generic-password -s evil';
    const error = await macKeychain(run)
      .set("forgeron", bad)
      .catch((e: Error) => e);
    expect((error as Error).message).not.toContain("evil");
    expect(calls).toHaveLength(0);
  });
});

describe("Linux secret-tool keychain", () => {
  it("stores the token on standard input", async () => {
    const { calls, run } = fake();
    await secretToolKeychain(run).set("forgeron", SECRET);
    expect(calls[0]!.command).toBe("secret-tool");
    expect(calls[0]!.args).toEqual([
      "store",
      "--label=Forgeron CLI token",
      "service",
      "forgeron",
      "account",
      "forgeron",
    ]);
    expect(calls[0]!.input).toBe(SECRET);
    expect(JSON.stringify(calls[0]!.args)).not.toContain(SECRET);
  });

  it("looks up, clears, and reads a missing entry as none", async () => {
    expect(await secretToolKeychain(fake({ stdout: SECRET }).run).get("forgeron")).toBe(SECRET);
    expect(await secretToolKeychain(fake({ code: 1 }).run).get("forgeron")).toBeUndefined();
    const { calls, run } = fake();
    await secretToolKeychain(run).delete("forgeron");
    expect(calls[0]!.args).toEqual(["clear", "service", "forgeron", "account", "forgeron"]);
  });

  it("rejects when the program is missing, so the credentials fall back to the file", async () => {
    const missing: Runner = async () => {
      throw new Error("spawn secret-tool ENOENT");
    };
    await expect(secretToolKeychain(missing).set("forgeron", SECRET)).rejects.toThrow(/ENOENT/);
  });
});

describe("systemKeychain", () => {
  it("picks an adapter per platform and none on Windows", () => {
    expect(systemKeychain("darwin", fake().run)).toBeDefined();
    expect(systemKeychain("linux", fake().run)).toBeDefined();
    expect(systemKeychain("win32", fake().run)).toBeUndefined();
  });
});
