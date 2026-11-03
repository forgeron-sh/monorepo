import { afterEach, expect, it, vi } from "vitest";
import { CONSOLE_API, fetchJson } from "./api";

afterEach(() => vi.unstubAllGlobals());

it("calls the gateway's console-api on the page's own origin", async () => {
  const fetchMock = vi.fn<typeof fetch>(async () => Response.json({ ok: true }));
  vi.stubGlobal("fetch", fetchMock);
  expect(await fetchJson("/tools")).toEqual({ ok: true });
  expect(fetchMock).toHaveBeenCalledWith(
    `${CONSOLE_API}/tools`,
    expect.objectContaining({ credentials: "same-origin" }),
  );
  expect(CONSOLE_API.startsWith("/")).toBe(true);
});

it("fails on an error status", async () => {
  vi.stubGlobal("fetch", async () => new Response("{}", { status: 401 }));
  await expect(fetchJson("/tools")).rejects.toThrow("401");
});
