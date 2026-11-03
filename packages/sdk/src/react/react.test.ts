import { createElement, type ReactElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { z } from "../index";
import { ViewClient, type ViewRuntime } from "./client";
import { useCan, useCanCall, useParams, useUser, ViewHost, defineView } from "./index";

function runtimeOf(
  overrides: Partial<ViewRuntime> & { search?: Record<string, string> } = {},
): ViewRuntime & { search: Record<string, string> } {
  const state = { search: overrides.search ?? {} };
  const listeners = new Set<() => void>();
  return {
    user: { id: "u1", email: "a@b.c", name: "Ada", roles: ["read"] },
    can: (level) => level === "read",
    canCall: (action) => action === "deals.list",
    call: vi.fn<Call>(async () => null),
    params: {
      get: () => state.search,
      set(next) {
        state.search = next;
        for (const l of listeners) l();
      },
      subscribe(l) {
        listeners.add(l);
        return () => listeners.delete(l);
      },
    },
    ...overrides,
    get search() {
      return state.search;
    },
  } as ViewRuntime & { search: Record<string, string> };
}

type Call = ViewRuntime["call"];

const Empty = () => null;

describe("defineView", () => {
  it("keeps what was declared, tagged as a view", () => {
    const view = defineView({
      title: "Pipeline",
      path: "/pipeline",
      access: "read",
      component: Empty,
    });
    expect(view).toMatchObject({ kind: "view", path: "/pipeline", access: "read" });
  });

  it.each([
    [{ title: "", path: "/a", access: "read" }, /title/],
    [{ title: "A", path: "a", access: "read" }, /start with/],
    [{ title: "A", path: "/api/x", access: "read" }, /reserved/],
    [{ title: "A", path: "/mcp", access: "read" }, /reserved/],
    [{ title: "A", path: "/a", access: "" }, /access/],
  ])("refuses %j", (options, message) => {
    expect(() => defineView({ component: Empty, ...options } as never)).toThrow(message);
  });

  it("allows a path that only starts like a reserved one", () => {
    expect(() =>
      defineView({ title: "A", path: "/apiary", access: "read", component: Empty }),
    ).not.toThrow();
  });
});

describe("ViewHost", () => {
  const probe = () => {
    const Component = () => {
      const user = useUser();
      return createElement("p", null, `${user.name}:${useCan("read")}:${useCan("admin")}`);
    };
    return Component;
  };

  it("renders the component with the person and what they can do", () => {
    const view = defineView({ title: "A", path: "/a", access: "read", component: probe() });
    expect(renderToString(createElement(ViewHost, { view, runtime: runtimeOf() }))).toContain(
      "Ada:true:false",
    );
  });

  it("tells whether an action may be called, as the runtime's matrix says", () => {
    const Component = () =>
      createElement("p", null, `${useCanCall("deals.list")}:${useCanCall("deals.move")}`);
    const view = defineView({ title: "A", path: "/a", access: "read", component: Component });
    expect(renderToString(createElement(ViewHost, { view, runtime: runtimeOf() }))).toContain(
      "true:false",
    );
  });

  it("checks access before rendering anything", () => {
    const rendered = vi.fn<() => void>();
    const view = defineView({
      title: "A",
      path: "/a",
      access: "admin",
      component: () => {
        rendered();
        return null;
      },
    });
    const html = renderToString(createElement(ViewHost, { view, runtime: runtimeOf() }));
    expect(html).toContain("Access denied");
    expect(rendered).not.toHaveBeenCalled();
  });

  it("refuses parameters that do not match the schema", () => {
    const view = defineView({
      title: "A",
      path: "/a",
      access: "read",
      params: z.object({ owner: z.string().min(3) }),
      component: Empty,
    });
    const html = renderToString(
      createElement(ViewHost, { view, runtime: runtimeOf({ search: { owner: "x" } }) as never }),
    );
    expect(html).toContain("Invalid parameters");
  });

  it("gives useParams the validated values", () => {
    const Component = () => {
      const [values] = useParams<{ owner: string; n: number }>();
      return createElement("p", null, `${values.owner}/${typeof values.n}`);
    };
    const view = defineView({
      title: "A",
      path: "/a",
      access: "read",
      params: z.object({ owner: z.string(), n: z.coerce.number() }),
      component: Component,
    });
    const element: ReactElement = createElement(ViewHost, {
      view,
      runtime: runtimeOf({ search: { owner: "ada", n: "3" } }),
    });
    expect(renderToString(element)).toContain("ada/number");
  });

  it("fails clearly when a hook runs outside a view", () => {
    const Bad = () => {
      useUser();
      return null;
    };
    expect(() => renderToString(createElement(Bad))).toThrow(/useUser must be used inside/);
  });
});

describe("ViewClient", () => {
  it("shares one read between components with the same input", () => {
    const client = new ViewClient(runtimeOf());
    expect(client.read("deals.list", { a: 1 })).toBe(client.read("deals.list", { a: 1 }));
    expect(client.read("deals.list", { a: 1 })).not.toBe(client.read("deals.list", { a: 2 }));
  });

  it("loads on first subscription and exposes data", async () => {
    const call = vi.fn<Call>(async () => [1, 2]);
    const client = new ViewClient(runtimeOf({ call }));
    const entry = client.read("deals.list", {});
    expect(entry.getSnapshot()).toEqual({ data: undefined, error: undefined, loading: true });
    const unsubscribe = entry.subscribe(() => {});
    await vi.waitFor(() => expect(entry.getSnapshot().loading).toBe(false));
    expect(entry.getSnapshot().data).toEqual([1, 2]);
    expect(call).toHaveBeenCalledWith("deals.list", {});
    unsubscribe();
  });

  it("keeps the previous data when a refetch fails, and exposes the error", async () => {
    const call = vi.fn<Call>().mockResolvedValueOnce("ok").mockRejectedValueOnce("boom");
    const entry = new ViewClient(runtimeOf({ call })).read("a.b", {});
    entry.subscribe(() => {});
    await vi.waitFor(() => expect(entry.getSnapshot().data).toBe("ok"));
    await entry.refetch();
    expect(entry.getSnapshot()).toMatchObject({ data: "ok", loading: false });
    expect(entry.getSnapshot().error?.message).toBe("boom");
  });

  it("ignores a response overtaken by a newer request", async () => {
    let first!: (v: string) => void;
    const call = vi
      .fn<Call>()
      .mockImplementationOnce(() => new Promise((r) => (first = r)))
      .mockResolvedValueOnce("new");
    const entry = new ViewClient(runtimeOf({ call })).read("a.b", {});
    entry.subscribe(() => {});
    await entry.refetch();
    first("old");
    await Promise.resolve();
    expect(entry.getSnapshot().data).toBe("new");
  });

  it("invalidates the reads of the same group after a write", async () => {
    const call = vi.fn<Call>(async (name: string) => name);
    const client = new ViewClient(runtimeOf({ call }));
    const deals = client.read("deals.list", {});
    const contacts = client.read("contacts.list", {});
    deals.subscribe(() => {});
    contacts.subscribe(() => {});
    await vi.waitFor(() => expect(deals.getSnapshot().loading).toBe(false));
    await vi.waitFor(() => expect(contacts.getSnapshot().loading).toBe(false));
    call.mockClear();
    await client.write("deals.move", { id: 1 });
    expect(call.mock.calls.map((c) => c[0]).toSorted()).toEqual(["deals.list", "deals.move"]);
  });

  it("re-reads a hidden read when it is shown again", async () => {
    const call = vi.fn<Call>(async () => "x");
    const client = new ViewClient(runtimeOf({ call }));
    const entry = client.read("deals.list", {});
    entry.subscribe(() => {})();
    await vi.waitFor(() => expect(entry.getSnapshot().loading).toBe(false));
    await client.write("deals.move", {});
    expect(call).toHaveBeenCalledTimes(2);
    entry.subscribe(() => {});
    await vi.waitFor(() => expect(call).toHaveBeenCalledTimes(3));
  });

  it("does not invalidate on a failed write", async () => {
    const call = vi.fn<Call>(async (name: string) => {
      if (name === "deals.move") throw new Error("denied");
      return null;
    });
    const client = new ViewClient(runtimeOf({ call }));
    const entry = client.read("deals.list", {});
    entry.subscribe(() => {});
    await vi.waitFor(() => expect(entry.getSnapshot().loading).toBe(false));
    await expect(client.write("deals.move", {})).rejects.toThrow("denied");
    expect(call).toHaveBeenCalledTimes(2);
  });

  it("refreshes on an interval while subscribed", async () => {
    vi.useFakeTimers();
    try {
      const call = vi.fn<Call>(async () => 1);
      const entry = new ViewClient(runtimeOf({ call })).read("a.b", {});
      const stop = entry.subscribe(() => {}, 1000);
      await vi.advanceTimersByTimeAsync(2500);
      expect(call).toHaveBeenCalledTimes(3);
      stop();
      await vi.advanceTimersByTimeAsync(5000);
      expect(call).toHaveBeenCalledTimes(3);
    } finally {
      vi.useRealTimers();
    }
  });
});
