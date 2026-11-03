import { describe, expect, it } from "vitest";
import type { CloudflareClient } from "./cloudflare";
import { createRestD1 } from "./d1-rest";

function recordingClient() {
  const requests: { method: string; path: string; body: unknown }[] = [];
  const client = {
    accountId: "acct",
    async request(method: string, path: string, body?: unknown) {
      requests.push({ method, path, body });
      return [{ results: [] }];
    },
  } as unknown as CloudflareClient;
  return { client, requests };
}

describe("createRestD1", () => {
  it("keeps the values of each binding of one prepared statement in a batch", async () => {
    const { client, requests } = recordingClient();
    const d1 = createRestD1(client, "db-1");
    const insert = d1.prepare(`INSERT INTO "t" ("part", "content") VALUES (?, ?)`);
    await d1.batch([insert.bind(0, "a"), insert.bind(1, "b"), insert.bind(2, "c")]);
    expect(requests).toHaveLength(1);
    expect(requests[0]?.body).toEqual({
      batch: [
        { sql: `INSERT INTO "t" ("part", "content") VALUES (?, ?)`, params: [0, "a"] },
        { sql: `INSERT INTO "t" ("part", "content") VALUES (?, ?)`, params: [1, "b"] },
        { sql: `INSERT INTO "t" ("part", "content") VALUES (?, ?)`, params: [2, "c"] },
      ],
    });
  });

  it("sends the bound values of a single query", async () => {
    const { client, requests } = recordingClient();
    const d1 = createRestD1(client, "db-1");
    await d1.prepare("SELECT ? AS n").bind(7).all();
    expect(requests[0]?.body).toEqual({ sql: "SELECT ? AS n", params: [7] });
  });
});
