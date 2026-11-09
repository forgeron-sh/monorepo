import { describe, expect, it } from "vitest";
import { createSecretBox } from "./secret-box";

// Rotation of the sealing key (D-100): a value sealed under a key that was replaced still opens while
// that key is listed as previous, and nothing new is sealed under it.

const key = (byte: number) => btoa(String.fromCharCode(...new Uint8Array(32).fill(byte)));
const OLD = key(1);
const NEW = key(2);

describe("the secret box and a rotated key", () => {
  it("opens a value sealed under the previous key, and seals under the current one", async () => {
    const before = await createSecretBox(OLD);
    const sealed = await before.seal("slot", "a test value");
    const after = await createSecretBox(NEW, [OLD]);
    expect(await after.open("slot", sealed)).toBe("a test value");

    // What the new box seals opens with the new key alone: the previous one was not used.
    const fresh = await after.seal("slot", "another test value");
    expect(await (await createSecretBox(NEW)).open("slot", fresh)).toBe("another test value");
    await expect((await createSecretBox(OLD)).open("slot", fresh)).rejects.toMatchObject({
      name: "OperationError",
    });
  });

  it("does not open it once the previous key is dropped", async () => {
    const sealed = await (await createSecretBox(OLD)).seal("slot", "a test value");
    await expect((await createSecretBox(NEW)).open("slot", sealed)).rejects.toMatchObject({
      name: "OperationError",
    });
  });

  it("still binds a value to its slot and refuses a value that no listed key sealed", async () => {
    const box = await createSecretBox(NEW, [OLD]);
    const sealed = await (await createSecretBox(OLD)).seal("slot", "a test value");
    await expect(box.open("another-slot", sealed)).rejects.toMatchObject({
      name: "OperationError",
    });
    const stranger = await (await createSecretBox(key(9))).seal("slot", "a test value");
    await expect(box.open("slot", stranger)).rejects.toMatchObject({ name: "OperationError" });
  });

  it("takes several previous keys, newest first or not", async () => {
    const oldest = await (await createSecretBox(key(3))).seal("slot", "oldest");
    const older = await (await createSecretBox(OLD)).seal("slot", "older");
    const box = await createSecretBox(NEW, [OLD, key(3)]);
    expect(await box.open("slot", older)).toBe("older");
    expect(await box.open("slot", oldest)).toBe("oldest");
  });

  it("refuses a previous key that is not 32 bytes", async () => {
    await expect(createSecretBox(NEW, ["c2hvcnQ="])).rejects.toThrow(/32 bytes/);
  });
});
