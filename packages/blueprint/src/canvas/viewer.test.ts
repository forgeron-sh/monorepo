// @vitest-environment jsdom
import { act, createElement as h } from "react";
import { createRoot } from "react-dom/client";
import { engineMemory } from "../engine";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { BlueprintStage } from "./stage";
import { fakeCanvas, FILE } from "./test-fixtures";
import { BlueprintViewer } from "./viewer";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLElement | undefined;
let root: ReturnType<typeof createRoot> | undefined;
// Under Node the engine starts from the module file; a browser awaits `initBlueprint()`.
beforeAll(() => {
  engineMemory();
});
beforeEach(() => {
  vi.stubGlobal("matchMedia", (q: string) => ({ matches: q.includes("reduce"), media: q }));
  fakeCanvas();
});
afterEach(async () => {
  await act(async () => root?.unmount());
  host?.remove();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const wait = () => act(async () => new Promise((r) => setTimeout(r, 10)));

async function mount() {
  host = document.createElement("div");
  document.body.append(host);
  const r = createRoot(host);
  root = r;
  let stage: BlueprintStage | null = null;
  await act(async () =>
    r.render(
      h(BlueprintViewer, {
        library: [
          { name: "towers.bp", load: async () => JSON.stringify(FILE) },
          { name: "empty.bp", load: async () => "{" },
        ],
        compositor: "2d",
        onStage: (s: BlueprintStage) => {
          stage = s;
        },
      }),
    ),
  );
  await wait();
  await wait();
  return { el: host, stage: stage! };
}

const button = (el: HTMLElement, text: string) =>
  [...el.querySelectorAll("button")].find((b) => b.textContent === text)!;

describe("<BlueprintViewer>", () => {
  it("loads the first library file and lists its scenes, assemblies and parts", async () => {
    const { el, stage } = await mount();
    const rows = [...el.querySelectorAll("[role=treeitem]")].map((r) => r.textContent);
    expect(rows.some((t) => t?.includes("towers"))).toBe(true);
    // Assemblies and parts are listed under their groups, closed at first.
    expect(rows.some((t) => t?.startsWith("Assemblies") && t.endsWith("1"))).toBe(true);
    expect(rows.some((t) => t?.startsWith("Parts") && t.endsWith("2"))).toBe(true);
    await act(async () => stage.flush());
    expect(stage.sceneOf("shown")?.spec.title).toBe("Two towers");
    expect(el.querySelector("[data-machine=story]")?.textContent).toContain("start");
  });

  it("switches the view from its buttons: a new picture in the next frame", async () => {
    const { el, stage } = await mount();
    stage.flush();
    const before = stage.sceneOf("shown")!.scene.slots.slice();
    await act(async () => button(el, "90°").click());
    stage.flush();
    expect(button(el, "90°").getAttribute("aria-pressed")).toBe("true");
    expect(stage.sceneOf("shown")!.scene.slots).not.toEqual(before);
    await act(async () => button(el, "Z-buffer").click());
    stage.flush();
    expect(stage.stats.refits).toBeGreaterThanOrEqual(3);
  });

  it("plays, pauses and scrubs the clock", async () => {
    const { el, stage } = await mount();
    const play = el.querySelector<HTMLButtonElement>("button[aria-label=Play]")!;
    await act(async () => play.click());
    await act(async () => stage.flush());
    expect(stage.playing).toBe(true);
    await act(async () => el.querySelector<HTMLButtonElement>("button[aria-label=Pause]")!.click());
    expect(stage.playing).toBe(false);
    // The scrub bar: its thumb is a range input; a key moves it by a step.
    const thumb = [...el.querySelectorAll<HTMLInputElement>("input[type=range]")].find(
      (i) => i.closest(".fg-bpv-transport") !== null,
    )!;
    await act(async () => {
      thumb.focus();
      thumb.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));
    });
    stage.flush();
    expect(stage.time).toBe(10);
    expect(stage.sceneOf("shown")!.scene.get("t")).toBe(10);
    await wait();
    expect(el.querySelector(".fg-bpv-time")?.textContent).toBe("10.00 s");
  });

  it("says why a file could not be read", async () => {
    const { el } = await mount();
    const select = el.querySelector<HTMLSelectElement>("select[aria-label=Library]")!;
    await act(async () => {
      select.value = "empty.bp";
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await wait();
    expect(el.textContent).toContain("not JSON");
  });
});
