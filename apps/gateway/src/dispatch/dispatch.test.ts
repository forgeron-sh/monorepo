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
        previews: { "feat-export": "acme--crm--pr-12" },
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
    identify?: (c: Caller) => string | undefined | Promise<string | undefined>;
    recordSeat?: (workspace: string, personId: string) => void | Promise<void>;
    recordUsage?: (workspace: string, tool: string, personId: string) => void | Promise<void>;
  } = {},
) {
  const seen = new Map<string, Request>();
  const targets = new Map<string, Target>(
    [
      "acme--crm--production",
      "acme--crm--pr-12",
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
    baseDomain: BASE,
    registry,
    targets: (w) => targets.get(w),
    ...hooks,
  });
  const get = async (url: string, init?: RequestInit) => {
    const response = await dispatch(new Request(url, init));
    return { status: response.status, body: (await response.json()) as Record<string, unknown> };
  };
  return { get, seen, targets };
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
      baseDomain: BASE,
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

  it("never reaches a Worker of another workspace or tool, even if the registry says so", async () => {
    const { get, targets } = setup();
    const response = await get("https://acme.forgeron.app/t/bad/mcp");
    expect(response.status).toBe(500);
    expect(targets.get("globex--crm--production")!.fetch).not.toHaveBeenCalled();
  });

  it("answers 502 when it holds no binding to the tool's Worker", async () => {
    const dispatch = createDispatcher({ baseDomain: BASE, registry, targets: () => undefined });
    const response = await dispatch(new Request("https://acme.forgeron.app/t/crm/mcp"));
    expect(response.status).toBe(502);
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
