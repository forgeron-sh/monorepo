// @vitest-environment jsdom
import { Delete02Icon } from "@forgeron/icons";
import { act, createElement as h } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SelectionBar as DriveSelectionBar } from "./blocks/drive-selection-bar";
import type { Action } from "./hooks/use-actions";
import {
  SelectionBarActions,
  SelectionBarClear,
  SelectionBarCount,
  SelectionBarRoot,
  SelectionBarSeparator,
} from "./parts-collection";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLElement | undefined;
let root: ReturnType<typeof createRoot> | undefined;
afterEach(async () => {
  await act(async () => root?.unmount());
  host?.remove();
  host = undefined;
});
const mount = async (element: Parameters<ReturnType<typeof createRoot>["render"]>[0]) => {
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  const r = root;
  await act(async () => r.render(element));
  return host;
};

const actions: Action[] = [
  { id: "share", label: "Share", run: vi.fn<(...args: unknown[]) => void>() },
  {
    id: "delete",
    label: "Delete",
    icon: Delete02Icon,
    danger: true,
    run: vi.fn<(...args: unknown[]) => void>(),
  },
];

describe("SelectionBar parts", () => {
  const bar = (count: number, onClear = () => {}, className?: string) =>
    h(
      SelectionBarRoot,
      { count, onClear, ...(className ? { className } : {}) },
      h(SelectionBarClear),
      h(SelectionBarCount),
      h(SelectionBarSeparator),
      h(SelectionBarActions, { actions }),
    );

  it("is drawn from one item, says how many, and is a toolbar", async () => {
    const el = await mount(bar(3));
    const toolbar = el.querySelector("[role=toolbar]")!;
    expect(toolbar.getAttribute("aria-label")).toBe("Selection");
    const count = el.querySelector(".fg-selbar-count")!;
    expect(count.textContent).toBe("3 selected");
    expect(count.getAttribute("aria-live")).toBe("polite");
    expect(el.textContent).toContain("Share");
  });
  it("draws nothing for none", async () => {
    const el = await mount(bar(0));
    expect(el.innerHTML).toBe("");
  });
  it("clears with the × and with Escape, and takes a className", async () => {
    const onClear = vi.fn<(...args: unknown[]) => void>();
    const el = await mount(bar(2, onClear, "mine"));
    expect(el.querySelector(".fg-selbar")!.classList.contains("mine")).toBe(true);
    await act(async () => el.querySelector<HTMLElement>("[aria-label='Clear selection']")!.click());
    expect(onClear).toHaveBeenCalledTimes(1);
    await act(async () => {
      el.querySelector("[role=toolbar]")!.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
      );
    });
    expect(onClear).toHaveBeenCalledTimes(2);
  });
  it("runs an action and reports its id", async () => {
    const onAction = vi.fn<(...args: unknown[]) => void>();
    const run = vi.fn<(...args: unknown[]) => void>();
    const el = await mount(
      h(
        SelectionBarRoot,
        { count: 1, onClear: () => {} },
        h(SelectionBarActions, { actions: [{ id: "share", label: "Share", run }], onAction }),
      ),
    );
    const share = [...el.querySelectorAll("button")].find((b) => b.textContent === "Share")!;
    await act(async () => share.click());
    expect(run).toHaveBeenCalledTimes(1);
    expect(onAction).toHaveBeenCalledWith("share");
  });
});

describe("SelectionBar of drive", () => {
  it("keeps its props: count, children in place of the count, iconOnly, inline", async () => {
    const el = await mount(
      h(DriveSelectionBar, {
        count: 2,
        onClear: () => {},
        actions,
        iconOnly: ["delete"],
        inline: 1,
        children: "Two files",
      }),
    );
    expect(el.querySelector(".fg-selbar-count")!.textContent).toBe("Two files");
    expect(el.querySelector("[aria-label='More actions']")).not.toBeNull();
  });
});
