import { describe, expect, it, vi } from "vitest";
import {
  createDispatcher,
  parseToolPath,
  workspaceOf,
  type Caller,
  type Registry,
  type ToolEntry,
  type Target,
} from "./dispatch";

const BASE = "forgeron.app";

describe("workspaceOf", () => {
  it("is the one label in front of the base domain", () => {
    expect(workspaceOf("acme.forgeron.app", BASE)).toBe("acme");
    expect(workspaceOf("ACME.forgeron.app:8787", BASE)).toBe("acme");
    expect(workspaceOf("acme.forgeron.app.", BASE)).toBe("acme");
  });

  it("refuses everything else", () => {
    for (const host of [
      "forgeron.app",
      "evilforgeron.app",
      "a.b.forgeron.app",
      "ac.forgeron.app",
      "acme_x.forgeron.app",
      "acme.forgeron.app.evil.com",
      "acme.other.app",
      `${"a".repeat(41)}.forgeron.app`,
    ]) {
      expect(workspaceOf(host, BASE)).toBeUndefined();
    }
  });

  it("refuses the reserved names", () => {
    for (const reserved of ["www", "app", "api", "docs", "status", "console", "mcp", "admin"]) {
      expect(workspaceOf(`${reserved}.forgeron.app`, BASE)).toBeUndefined();
    }
    expect(workspaceOf("auth.forgeron.app", BASE)).toBeUndefined();
    expect(workspaceOf("cdn.forgeron.app", BASE)).toBeUndefined();
    expect(workspaceOf("static.forgeron.app", BASE)).toBeUndefined();
    expect(workspaceOf("play.forgeron.app", BASE)).toBeUndefined();
  });
});

describe("parseToolPath", () => {
  it("reads tool, branch and the path the tool sees", () => {
    expect(parseToolPath("/t/crm")).toEqual({ tool: "crm", rest: "/" });
    expect(parseToolPath("/t/crm/mcp")).toEqual({ tool: "crm", rest: "/mcp" });
    expect(parseToolPath("/t/crm/api/deals.move")).toEqual({
      tool: "crm",
      rest: "/api/deals.move",
    });
    expect(parseToolPath("/t/crm@feat-export/mcp")).toEqual({
      tool: "crm",
      branch: "feat-export",
      rest: "/mcp",
    });
    // A permanent channel other than production (D-125): its reference is `~<name>`.
    expect(parseToolPath("/t/crm~staging/mcp")).toEqual({
      tool: "crm",
      branch: "~staging",
      rest: "/mcp",
    });
  });

  it("refuses what is not a tool path", () => {
    for (const path of [
      "/",
      "/mcp",
      "/t",
      "/t/",
      "/t//mcp",
      "/t/CRM",
      "/t/crm@",
      "/t/crm@a@b",
      "/t/crm@A/x",
      "/t/crm~",
      "/t/crm~Staging",
      "/t/crm~a~b",
      "/t/crm~1x",
      "/tools/crm",
    ]) {
      expect({ path, parsed: parseToolPath(path) }).toEqual({ path, parsed: undefined });
    }
  });
});

// Two workspaces with a tool each, to see that a request never leaves its own.
const registry: Registry = {
  find(workspace, tool): ToolEntry | undefined {
    if (workspace === "acme" && tool === "crm") {
      return {
        production: "acme--crm--production",
        previews: { "feat-export": "acme--crm--pr-12", "~staging": "acme--crm--channel-staging" },
      };
    }
    if (workspace === "acme" && tool === "odoo")
      return { production: "acme--odoo--production", previews: {} };
    if (workspace === "globex" && tool === "crm")
      return { production: "globex--crm--production", previews: {} };
    if (workspace === "acme" && tool === "bad")
      return { production: "globex--crm--production", previews: {} };
    return undefined;
  },
};

function setup(
  hooks: {
    canPreview?: (c: Caller & { branch: string }) => boolean;
    viewAsset?: (a: { workspace: string; tool: string; token: string }) => boolean;
    identify?: (c: Caller) => string | undefined | Promise<string | undefined>;
    recordSeat?: (workspace: string, personId: string) => void | Promise<void>;
    recordUsage?: (workspace: string, tool: string, personId: string) => void | Promise<void>;
    defer?: (work: Promise<unknown>) => void;
  } = {},
) {
  const seen = new Map<string, Request>();
  const targets = new Map<string, Target>(
    [
      "acme--crm--production",
      "acme--crm--pr-12",
      "acme--crm--channel-staging",
      "acme--odoo--production",
      "globex--crm--production",
    ].map((name) => [
      name,
      {
        fetch: vi.fn<(request: Request) => Response>((request) => {
          seen.set(name, request);
          return Response.json({ worker: name, path: new URL(request.url).pathname });
        }),
      },
    ]),
  );
  const dispatch = createDispatcher({
    workspaceOf: (host: string) => workspaceOf(host, BASE),
    registry,
    targets: (w) => targets.get(w),
    ...hooks,
  });
  const get = async (url: string, init?: RequestInit) => {
    const response = await dispatch(new Request(url, init));
    return { status: response.status, body: (await response.json()) as Record<string, unknown> };
  };
  /** The `Server-Timing` header of an answer (D-142). */
  const timing = async (url: string, init?: RequestInit) =>
    (await dispatch(new Request(url, init))).headers.get("server-timing");
  /** The status and whether a sandboxed page may read the answer (`access-control-allow-origin`). */
  const peek = async (url: string, init?: RequestInit) => {
    const response = await dispatch(new Request(url, init));
    return { status: response.status, cors: response.headers.get("access-control-allow-origin") };
  };
  return { get, peek, timing, seen, targets };
}

describe("dispatch", () => {
  it("sends a request to the tool of its workspace, with the path the tool sees", async () => {
    const { get, seen } = setup();
    expect(await get("https://acme.forgeron.app/t/crm/api/deals.move?x=1")).toEqual({
      status: 200,
      body: { worker: "acme--crm--production", path: "/api/deals.move" },
    });
    expect(seen.get("acme--crm--production")!.url).toBe(
      "https://acme.forgeron.app/api/deals.move?x=1",
    );
    expect((await get("https://globex.forgeron.app/t/crm/mcp")).body.worker).toBe(
      "globex--crm--production",
    );
    expect((await get("https://acme.forgeron.app/t/odoo")).body).toEqual({
      worker: "acme--odoo--production",
      path: "/",
    });
  });

  it("keeps the method and the body", async () => {
    const { get, seen } = setup();
    await get("https://acme.forgeron.app/t/crm/api/deals.move", {
      method: "POST",
      body: JSON.stringify({ id: 1 }),
      headers: { authorization: "Bearer t" },
    });
    const forwarded = seen.get("acme--crm--production")!;
    expect(forwarded.method).toBe("POST");
    expect(await forwarded.json()).toEqual({ id: 1 });
    expect(forwarded.headers.get("authorization")).toBe("Bearer t");
  });

  it("never hands the session cookie to a tool: its code cannot read it", async () => {
    const { get, seen } = setup();
    await get("https://acme.forgeron.app/t/crm/api/x", {
      headers: { cookie: "__Host-fg_session=secret; other=1", authorization: "Bearer t" },
    });
    const forwarded = seen.get("acme--crm--production")!;
    expect(forwarded.headers.get("cookie")).toBeNull();
    expect(forwarded.headers.get("authorization")).toBe("Bearer t");
  });

  it("confines what a tool answers: sandboxed, no sniffing, no cookie of its own", async () => {
    const dispatch = createDispatcher({
      workspaceOf: (host: string) => workspaceOf(host, BASE),
      registry,
      targets: () => ({
        fetch: () =>
          new Response("<script>fetch('/whoami')</script>", {
            headers: [
              ["content-type", "text/html"],
              ["content-security-policy", "default-src *"],
              ["set-cookie", "__Host-fg_session=planted; Path=/"],
              ["set-cookie", "a=b"],
            ],
          }),
      }),
    });
    const response = await dispatch(new Request("https://acme.forgeron.app/t/crm/anything"));
    expect(response.headers.get("content-security-policy")).toMatch(/^sandbox allow-scripts /);
    expect(response.headers.get("content-security-policy")).not.toContain("allow-same-origin");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.getSetCookie()).toEqual([]);
    expect(await response.text()).toContain("fetch");
  });

  it("answers 404 for an unknown workspace, host, tool or non-tool path, reaching no tool", async () => {
    const { get, targets } = setup();
    for (const url of [
      "https://nobody.forgeron.app/t/crm/mcp",
      "https://www.forgeron.app/t/crm/mcp",
      "https://forgeron.app/t/crm/mcp",
      "https://acme.forgeron.app/t/missing/mcp",
      "https://acme.forgeron.app/mcp",
      "https://acme.forgeron.app/",
      "https://globex.forgeron.app/t/odoo/mcp",
    ]) {
      expect({ url, status: (await get(url)).status }).toEqual({ url, status: 404 });
    }
    for (const target of targets.values()) expect(target.fetch).not.toHaveBeenCalled();
  });

  it("serves production at the address everyone uses, whoever calls", async () => {
    const anonymous = setup();
    expect((await anonymous.get("https://acme.forgeron.app/t/crm/mcp")).body.worker).toBe(
      "acme--crm--production",
    );
    const known = setup({ identify: () => "ada" });
    expect((await known.get("https://acme.forgeron.app/t/crm/mcp")).body.worker).toBe(
      "acme--crm--production",
    );
    expect((await known.get("https://acme.forgeron.app/t/odoo/mcp")).body.worker).toBe(
      "acme--odoo--production",
    );
  });

  it("reads a preview's scripts with the token of the page, since a sandboxed page sends no cookie (D-134)", async () => {
    const hook = vi.fn<(a: { workspace: string; tool: string; token: string }) => boolean>(
      (a) => a.token === "good",
    );
    const { get, seen } = setup({ canPreview: () => false, viewAsset: hook });
    const ok = await get("https://acme.forgeron.app/t/crm@feat-export/_f/a/good/views/chunks/x.js");
    expect(ok.status).toBe(200);
    // The tool and the views see the plain path.
    expect(ok.body).toEqual({ worker: "acme--crm--pr-12", path: "/_f/views/chunks/x.js" });
    expect(hook).toHaveBeenCalledWith({ workspace: "acme", tool: "crm", token: "good" });
    expect(seen.get("acme--crm--pr-12")!.url).toBe(
      "https://acme.forgeron.app/_f/views/chunks/x.js",
    );
  });

  it("refuses a script with a wrong token, and says so in a way the sandboxed page can read", async () => {
    const { peek, targets } = setup({ canPreview: () => true, viewAsset: () => false });
    const refused = await peek("https://acme.forgeron.app/t/crm@feat-export/_f/a/bad/views/a.js");
    expect(refused.status).toBe(403);
    // Without this header the browser reports a CORS error and hides the refusal.
    expect(refused.cors).toBe("*");
    expect(targets.get("acme--crm--pr-12")!.fetch).not.toHaveBeenCalled();
  });

  it("answers the preflight of a page's call on a preview, which carries no token, and checks the call itself (D-134)", async () => {
    const { peek, targets } = setup({ canPreview: () => false });
    const url = "https://acme.forgeron.app/t/crm@feat-export/_f/call/deals.list";
    const preflight = await peek(url, {
      method: "OPTIONS",
      headers: { origin: "null", "access-control-request-method": "POST" },
    });
    expect(preflight).toEqual({ status: 204, cors: "*" });
    // The call is the one that is refused, and the page can read why.
    const call = await peek(url, { method: "POST" });
    expect(call).toEqual({ status: 403, cors: "*" });
    expect(targets.get("acme--crm--pr-12")!.fetch).not.toHaveBeenCalled();
    // The preflight of something that is not a page's call is still not answered.
    const other = await peek("https://acme.forgeron.app/t/crm@feat-export/mcp", {
      method: "OPTIONS",
    });
    expect(other.status).toBe(403);
  });

  it("does not take the token for anything but a script", async () => {
    const { get, targets } = setup({ canPreview: () => false, viewAsset: () => true });
    const other = await get("https://acme.forgeron.app/t/crm@feat-export/_f/a/good/api/deals.move");
    expect(other.status).toBe(403);
    expect(targets.get("acme--crm--pr-12")!.fetch).not.toHaveBeenCalled();
  });

  it("fails closed when nothing checks the token", async () => {
    const { get } = setup({ canPreview: () => true });
    expect(
      (await get("https://acme.forgeron.app/t/crm@feat-export/_f/a/any/views/a.js")).status,
    ).toBe(403);
  });

  it("says why a script of a channel the person cannot open is refused, in a readable way", async () => {
    const { peek } = setup({ canPreview: () => false });
    const refused = await peek("https://acme.forgeron.app/t/crm@feat-export/_f/views/a.js");
    expect(refused.status).toBe(403);
    expect(refused.cors).toBe("*");
    // The rest of the channel is not given that header.
    expect((await peek("https://acme.forgeron.app/t/crm@feat-export/mcp")).cors).toBeNull();
  });

  it("says where the time of a call went, step by step, in Server-Timing (D-142)", async () => {
    const { timing } = setup({
      identify: () => "p1",
      recordSeat: () => undefined,
      recordUsage: () => undefined,
    });
    const header = (await timing("https://acme.forgeron.app/t/crm/api/deals.move"))!;
    const steps = header.split(", ").map((part) => part.split(";")[0]);
    expect(steps).toEqual(["identify", "find", "seat", "views", "forward", "tool", "total"]);
    for (const part of header.split(", ")) expect(part).toMatch(/^[\w.]+;dur=\d+\.\d$/);
  });

  it("counts the seat after the answer when it can, and does not wait for it (D-143)", async () => {
    const deferred: Promise<unknown>[] = [];
    let counted = false;
    const { get } = setup({
      identify: () => "p1",
      recordSeat: async () => {
        await new Promise((resolve) => setTimeout(resolve, 20));
        counted = true;
      },
      defer: (work) => void deferred.push(work),
    });
    expect((await get("https://acme.forgeron.app/t/crm/mcp")).status).toBe(200);
    expect(counted).toBe(false);
    await Promise.all(deferred);
    expect(counted).toBe(true);
  });

  it("gives no timing to a call that is refused before it reaches a tool", async () => {
    const { timing } = setup();
    expect(await timing("https://acme.forgeron.app/t/nope/mcp")).toBeNull();
    expect(await timing("https://acme.forgeron.app/t/crm@feat-export/mcp")).toBeNull();
  });

  it("routes a branch to its preview, for those who may see it", async () => {
    const allowed = setup({ canPreview: (c) => c.branch === "feat-export" });
    expect(await allowed.get("https://acme.forgeron.app/t/crm@feat-export/mcp")).toEqual({
      status: 200,
      body: { worker: "acme--crm--pr-12", path: "/mcp" },
    });
    expect((await allowed.get("https://acme.forgeron.app/t/crm@other/mcp")).status).toBe(404);
    expect((await allowed.get("https://acme.forgeron.app/t/odoo@feat-export/mcp")).status).toBe(
      404,
    );

    const denied = setup({ canPreview: () => false });
    expect((await denied.get("https://acme.forgeron.app/t/crm@feat-export/mcp")).status).toBe(403);
    // Nobody sees a preview when nothing says who may.
    const none = setup();
    expect((await none.get("https://acme.forgeron.app/t/crm@feat-export/mcp")).status).toBe(403);
    expect(none.targets.get("acme--crm--pr-12")!.fetch).not.toHaveBeenCalled();
  });

  it("routes ~<name> to a permanent channel, under the same rule (D-125)", async () => {
    const asked: string[] = [];
    const allowed = setup({
      canPreview: (c) => {
        asked.push(c.branch);
        return true;
      },
    });
    expect(await allowed.get("https://acme.forgeron.app/t/crm~staging/mcp")).toEqual({
      status: 200,
      body: { worker: "acme--crm--channel-staging", path: "/mcp" },
    });
    expect(asked).toEqual(["~staging"]);
    // A branch named like the channel is another channel.
    expect((await allowed.get("https://acme.forgeron.app/t/crm@staging/mcp")).status).toBe(404);
    const denied = setup({ canPreview: () => false });
    expect((await denied.get("https://acme.forgeron.app/t/crm~staging/mcp")).status).toBe(403);
  });

  it("never reaches a Worker of another workspace or tool, even if the registry says so", async () => {
    const { get, targets } = setup();
    const response = await get("https://acme.forgeron.app/t/bad/mcp");
    expect(response.status).toBe(500);
    expect(targets.get("globex--crm--production")!.fetch).not.toHaveBeenCalled();
  });

  it("answers 502 when it holds no binding to the tool's Worker", async () => {
    const dispatch = createDispatcher({
      workspaceOf: (host: string) => workspaceOf(host, BASE),
      registry,
      targets: () => undefined,
    });
    const response = await dispatch(new Request("https://acme.forgeron.app/t/crm/mcp"));
    expect(response.status).toBe(502);
  });

  describe("a call prepared while the tool is looked up (D-145)", () => {
    const build = (found: ToolEntry | undefined) => {
      const order: string[] = [];
      const target = {
        fetch: vi.fn<(request: Request) => Response>(() => Response.json({ ok: true })),
      };
      const dispatch = createDispatcher({
        workspaceOf: (host: string) => workspaceOf(host, BASE),
        registry: {
          async find() {
            order.push("find:start");
            await new Promise((resolve) => setTimeout(resolve, 5));
            order.push("find:end");
            return found;
          },
        },
        targets: () => target,
        forward: async () => {
          order.push("forward:start");
          return { headers: { "x-forgeron-user": "{}" } };
        },
      });
      return { dispatch, order, target };
    };
    const tool = { production: "acme--crm--production", previews: {} };

    it("starts the forwarding of a call before the tool is found", async () => {
      const { dispatch, order, target } = build(tool);
      const response = await dispatch(
        new Request("https://acme.forgeron.app/t/crm/mcp", { method: "POST", body: "{}" }),
      );
      expect(response.status).toBe(200);
      expect(order.indexOf("forward:start")).toBeLessThan(order.indexOf("find:end"));
      expect(target.fetch.mock.calls[0]![0].headers.get("x-forgeron-user")).toBe("{}");
    });

    it("waits for the tool before preparing a read, which may be a page", async () => {
      const { dispatch, order } = build(tool);
      await dispatch(new Request("https://acme.forgeron.app/t/crm/api/deals.list"));
      expect(order).toEqual(["find:start", "find:end", "forward:start"]);
    });

    it("sends nothing it prepared for a tool that does not exist", async () => {
      const { dispatch, target } = build(undefined);
      const response = await dispatch(
        new Request("https://acme.forgeron.app/t/crm/mcp", { method: "POST", body: "{}" }),
      );
      expect(response.status).toBe(404);
      expect(target.fetch).not.toHaveBeenCalled();
    });
  });

  describe("seats", () => {
    it("counts the authenticated person of a call that reaches a tool", async () => {
      const recordSeat = vi.fn<(workspace: string, personId: string) => void>();
      const { get } = setup({
        identify: (c) => c.request.headers.get("x-person") ?? undefined,
        recordSeat,
      });
      await get("https://acme.forgeron.app/t/crm/mcp", { headers: { "x-person": "p1" } });
      await get("https://acme.forgeron.app/t/crm/mcp");
      expect(recordSeat).toHaveBeenCalledTimes(1);
      expect(recordSeat).toHaveBeenCalledWith("acme", "p1");
    });

    it("counts nothing for a call that reaches no tool", async () => {
      const recordSeat = vi.fn<(workspace: string, personId: string) => void>();
      const { get } = setup({ identify: () => "p1", recordSeat });
      await get("https://acme.forgeron.app/t/missing/mcp");
      expect(recordSeat).not.toHaveBeenCalled();
    });

    it("never blocks the call when counting fails", async () => {
      const { get } = setup({
        identify: () => "p1",
        recordSeat: () => {
          throw new Error("D1 is down");
        },
      });
      expect((await get("https://acme.forgeron.app/t/crm/mcp")).status).toBe(200);
    });
  });

  describe("usage (D-093)", () => {
    it("counts the call per tool and person, for an authenticated call that reaches a tool only", async () => {
      const recordUsage = vi.fn<(workspace: string, tool: string, personId: string) => void>();
      const { get } = setup({
        identify: (c) => c.request.headers.get("x-person") ?? undefined,
        recordSeat: () => {},
        recordUsage,
      });
      await get("https://acme.forgeron.app/t/crm/mcp", { headers: { "x-person": "p1" } });
      await get("https://acme.forgeron.app/t/crm/mcp");
      await get("https://acme.forgeron.app/t/missing/mcp", { headers: { "x-person": "p1" } });
      expect(recordUsage).toHaveBeenCalledTimes(1);
      expect(recordUsage).toHaveBeenCalledWith("acme", "crm", "p1");
    });

    it("never blocks the call when counting fails", async () => {
      const { get } = setup({
        identify: () => "p1",
        recordSeat: () => {},
        recordUsage: () => {
          throw new Error("D1 is down");
        },
      });
      expect((await get("https://acme.forgeron.app/t/crm/mcp")).status).toBe(200);
    });
  });
});
