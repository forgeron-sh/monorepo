import type { D1Database } from "@forgeron/hosting";
import { createRegistry, migratePlatform } from "@forgeron/registry";
import { createMemoryD1 } from "@forgeron/sdk/testing/d1";
import { describe, expect, it } from "vitest";
import { fetchPicture, refreshProviderAvatar, serveAvatar } from "./avatar";

const PNG_BYTES = Uint8Array.from(
  atob(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  ),
  (c) => c.charCodeAt(0),
);
const image =
  (type = "image/png", bytes: Uint8Array = PNG_BYTES) =>
  async () =>
    new Response(bytes, { headers: { "content-type": type } });

describe("fetchPicture", () => {
  it("copies a small png, jpeg or webp over https as a data URL", async () => {
    const url = await fetchPicture("https://idp.test/a.png", image());
    expect(url).toMatch(/^data:image\/png;base64,/);
  });

  it("refuses http, other types, big files and failures", async () => {
    expect(await fetchPicture("http://idp.test/a.png", image())).toBeUndefined();
    expect(await fetchPicture("https://idp.test/a.svg", image("image/svg+xml"))).toBeUndefined();
    expect(
      await fetchPicture("https://idp.test/a.png", image("image/png", new Uint8Array(70_000))),
    ).toBeUndefined();
    expect(await fetchPicture("not a url", image())).toBeUndefined();
    expect(
      await fetchPicture("https://idp.test/a.png", async () => {
        throw new Error("down");
      }),
    ).toBeUndefined();
  });
});

describe("the provider's picture and its serving", () => {
  it("is copied once per address, kept apart from the person's own, and served with the image's own type", async () => {
    const memory = await createMemoryD1();
    try {
      const d1 = memory as unknown as D1Database;
      await migratePlatform(d1);
      const registry = createRegistry(d1);
      const { id } = await registry.addMember({
        workspace: "acme",
        subject: "s",
        email: "a@acme.test",
        name: "A",
        teams: [],
      });
      let calls = 0;
      const fetchImage = async () => {
        calls += 1;
        return new Response(PNG_BYTES, { headers: { "content-type": "image/png" } });
      };
      await refreshProviderAvatar(registry, "acme", id, "https://idp.test/a.png", fetchImage);
      await refreshProviderAvatar(registry, "acme", id, "https://idp.test/a.png", fetchImage);
      expect(calls).toBe(1);
      await refreshProviderAvatar(registry, "acme", id, undefined, fetchImage);
      await refreshProviderAvatar(registry, "acme", id, "http://insecure.test/x.png", fetchImage);
      expect(calls).toBe(1);

      const served = await serveAvatar(registry, "acme", id);
      expect(served.status).toBe(200);
      expect(served.headers.get("content-type")).toBe("image/png");
      expect(served.headers.get("content-security-policy")).toContain("sandbox");
      expect((await served.arrayBuffer()).byteLength).toBe(PNG_BYTES.length);
      expect((await serveAvatar(registry, "acme", "nobody")).status).toBe(404);
      expect((await serveAvatar(registry, "other-workspace", id)).status).toBe(404);
    } finally {
      await memory.close();
    }
  });
});
