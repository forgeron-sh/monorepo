import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { buildTool, type BuildResult } from "./index";

const fixture = (name: string) => fileURLToPath(new URL(`../fixtures/${name}`, import.meta.url));

// A tool declaring `google-workspace` and `microsoft-365` connectors (D-048), built, then run as the
// gateway runs it: identity and the caller's tokens in headers, the providers simulated by `fetch`.

interface Worker {
  default: { fetch(request: Request): Promise<Response> };
}

const person = JSON.stringify({
  id: "ada",
  email: "ada@example.test",
  name: "Ada",
  subjects: ["everyone"],
});
const gateway = (action: string, headers: Record<string, string> = {}) =>
  new Request(`https://inbox.test/api/${action}`, {
    headers: { "x-forgeron-user": person, ...headers },
  });

describe("connectors in a built tool", () => {
  let built: BuildResult;
  let worker: Worker;
  const seen: Array<{ url: string; authorization: string | null }> = [];

  beforeAll(async () => {
    built = await buildTool(fixture("connectors-tool"));
    worker = (await import(pathToFileURL(join(built.outDir, "worker.js")).href)) as Worker;
  }, 60_000);

  afterEach(() => {
    vi.unstubAllGlobals();
    seen.length = 0;
  });

  // The simulated providers: they answer for the hosts of the connectors and note the token.
  const simulate = () =>
    vi.stubGlobal("fetch", async (input: unknown, init?: { headers?: Record<string, string> }) => {
      const url = String(input);
      seen.push({ url, authorization: init?.headers?.authorization ?? null });
      if (url.startsWith("https://gmail.googleapis.com/")) {
        return Response.json({ messages: [{ id: "m1" }] });
      }
      if (url === "https://graph.microsoft.com/v1.0/me") {
        return Response.json({ displayName: "Ada" });
      }
      return new Response("unexpected host", { status: 500 });
    });

  const tokens = JSON.stringify({ google: "google-token", microsoft: "microsoft-token" });

  it("records the connectors in the manifest and bundles their definitions", async () => {
    const manifest = JSON.parse(await readFile(join(built.outDir, "manifest.json"), "utf8"));
    expect(Object.keys(manifest.resources.connectors)).toEqual(["google", "microsoft"]);
    const code = await readFile(join(built.outDir, "worker.js"), "utf8");
    expect(code).toContain("googleapis.com");
    expect(code).toContain("graph.microsoft.com");
  });

  it("populates ctx.connectors.google from the caller's token", async () => {
    simulate();
    const response = await worker.default.fetch(
      gateway("gmail", { "x-forgeron-connector-tokens": tokens }),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ messages: [{ id: "m1" }] });
    expect(seen).toEqual([
      {
        url: "https://gmail.googleapis.com/gmail/v1/users/me/messages",
        authorization: "Bearer google-token",
      },
    ]);
  });

  it("populates ctx.connectors.microsoft with the Graph client", async () => {
    simulate();
    const response = await worker.default.fetch(
      gateway("me", { "x-forgeron-connector-tokens": tokens }),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ displayName: "Ada" });
    expect(seen).toEqual([
      { url: "https://graph.microsoft.com/v1.0/me", authorization: "Bearer microsoft-token" },
    ]);
  });

  it("asks for consent, calling no provider, when the gateway sent no token", async () => {
    simulate();
    const link = "/console-api/api/tools/inbox/environments/production/consent/google";
    const response = await worker.default.fetch(
      gateway("gmail", {
        "x-forgeron-connector-tokens": JSON.stringify({ microsoft: "microsoft-token" }),
        "x-forgeron-connector-consent": JSON.stringify({ google: link }),
      }),
    );
    expect(response.status).toBe(428);
    expect(JSON.stringify(await response.json())).toContain(link);
    expect(seen).toEqual([]);
  });
});

describe("a connector without its package", () => {
  it("is refused at build, naming the package to install", async () => {
    await expect(buildTool(fixture("connectors-missing"))).rejects.toThrow(
      /@forgeron\/connector-slack is not installed/,
    );
  }, 60_000);
});
