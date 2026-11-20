// @vitest-environment jsdom
import { act, createElement as h } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup as html } from "react-dom/server";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import {
  ICON_SECTIONS,
  IconByName,
  IconPicker,
  loadIconCatalog,
  moveInRows,
  searchIcons,
  type IconCatalog,
} from "./index";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let catalog: IconCatalog;
beforeAll(async () => {
  catalog = await loadIconCatalog();
}, 30_000);

let host: HTMLElement | undefined;
let root: ReturnType<typeof createRoot> | undefined;
afterEach(async () => {
  await act(async () => root?.unmount());
  host?.remove();
  host = undefined;
  root = undefined;
  window.localStorage.clear();
});
const mount = async (element: Parameters<ReturnType<typeof createRoot>["render"]>[0]) => {
  host = document.createElement("div");
  document.body.append(host);
  const r = createRoot(host);
  root = r;
  await act(async () => r.render(element));
  return host;
};
const click = async (el: Element | null | undefined) => {
  if (!el) throw new Error("element not found");
  await act(async () => (el as HTMLElement).click());
};
const input = () => document.querySelector<HTMLInputElement>(".fg-iconpick-input")!;
const type = async (text: string) => {
  const el = input();
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
  await act(async () => {
    setter.call(el, text);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
};
const key = async (k: string, init: KeyboardEventInit = {}) =>
  act(async () => {
    input().dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, ...init }));
  });
const options = () => [...document.querySelectorAll<HTMLElement>("[role=option]")];
const activeName = () => {
  const id = input().getAttribute("aria-activedescendant");
  return id ? document.getElementById(id)?.getAttribute("aria-label") : null;
};
const open = async (props: Parameters<typeof IconPicker>[0] = {}) => {
  const el = await mount(h(IconPicker, { label: "Page icon", ...props }));
  await click(el.querySelector("button"));
  return el;
};

describe("icon catalog", () => {
  it("holds drawn icons only, one name per drawing", () => {
    const names = new Set(catalog.entries.map((e) => e.name));
    expect(names.size).toBe(catalog.entries.length);
    expect(catalog.entries.length).toBeGreaterThan(1000);
    expect(catalog.entries.every((e) => e.icon.rows.length > 0)).toBe(true);
  });
  it("finds by name, by word, by another name of the drawing and by synonym", () => {
    expect(searchIcons(catalog.entries, "rocket")[0]?.name).toMatch(/^rocket/);
    expect(searchIcons(catalog.entries, "anvil")[0]?.name).toBe("anvil");
    expect(searchIcons(catalog.entries, "gear").some((e) => e.name.startsWith("settings"))).toBe(
      true,
    );
    expect(searchIcons(catalog.entries, "zzzz-nothing")).toEqual([]);
  });
  it("lists only drawn names in its sections", () => {
    for (const section of ICON_SECTIONS) {
      expect(section.icons.filter((name) => !catalog.byName.has(name))).toEqual([]);
    }
  });
});

describe("moveInRows", () => {
  const rows = [[0, 1, 2], [3], [4, 5, 6]];
  it("moves by cell, by row, to the ends", () => {
    expect(moveInRows(rows, 1, "ArrowRight")).toBe(2);
    expect(moveInRows(rows, 2, "ArrowRight")).toBe(3);
    expect(moveInRows(rows, 2, "ArrowDown")).toBe(3);
    expect(moveInRows(rows, 3, "ArrowDown")).toBe(4);
    expect(moveInRows(rows, 5, "ArrowUp")).toBe(3);
    expect(moveInRows(rows, 5, "Home")).toBe(4);
    expect(moveInRows(rows, 4, "End")).toBe(6);
    expect(moveInRows(rows, 4, "Home", { toEnds: true })).toBe(0);
    expect(moveInRows(rows, 0, "PageDown", { page: 5 })).toBe(4);
    expect(moveInRows(rows, -1, "ArrowDown")).toBe(0);
    expect(moveInRows(rows, 0, "a")).toBeNull();
  });
});

describe("IconByName", () => {
  it("draws a common icon on the server, a placeholder for the rest", () => {
    expect(html(h(IconByName, { name: "rocket-01" }))).toContain("<svg");
    expect(html(h(IconByName, { name: "kanban" }))).toContain("fg-iconpick-ph");
  });
  it("draws any drawn name once the catalog is there", async () => {
    const el = await mount(h(IconByName, { name: "kanban", tone: "accent" }));
    expect(el.querySelector("svg")).not.toBeNull();
    expect(el.querySelector(".fg-iconpick-tone-accent")).not.toBeNull();
  });
});

describe("IconPicker", () => {
  it("shows the current icon in its trigger", async () => {
    const el = await mount(h(IconPicker, { label: "Page icon", defaultValue: "rocket-01" }));
    const trigger = el.querySelector("button")!;
    expect(trigger.getAttribute("aria-label")).toBe("Page icon: rocket 01");
    expect(trigger.querySelector("svg")).not.toBeNull();
  });

  it("filters by search", async () => {
    await open();
    expect(options().length).toBeGreaterThan(100);
    await type("rocket");
    const names = options().map((o) => o.getAttribute("aria-label"));
    expect(names.length).toBeGreaterThan(0);
    expect(names.every((n) => n?.includes("rocket"))).toBe(true);
  });

  it("moves with the arrows and picks with Enter", async () => {
    const onChange = vi.fn<(name: string | null) => void>();
    await open({ onChange });
    await key("ArrowDown");
    const first = activeName();
    expect(first).toBe(options()[0]?.getAttribute("aria-label"));
    await key("ArrowRight");
    const second = activeName();
    expect(second).toBe(options()[1]?.getAttribute("aria-label"));
    await key("ArrowDown");
    expect(activeName()).toBe(options()[11]?.getAttribute("aria-label"));
    await key("Home");
    expect(activeName()).toBe(options()[10]?.getAttribute("aria-label"));
    await key("ArrowUp");
    await key("ArrowRight");
    await key("Enter");
    expect(onChange).toHaveBeenCalledWith(second?.replace(/ /g, "-"));
    expect(document.querySelector(".fg-iconpick")).toBeNull();
  });

  it("picks the first result with Enter after a search", async () => {
    const onChange = vi.fn<(name: string | null) => void>();
    await open({ onChange });
    await type("anvil");
    await key("Enter");
    expect(onChange).toHaveBeenCalledWith("anvil");
  });

  it("puts a picked icon first in Recent and remembers it under recentsKey", async () => {
    const el = await open({ recentsKey: "test-icons" });
    await type("anvil");
    await key("Enter");
    expect(JSON.parse(window.localStorage.getItem("test-icons")!)).toEqual(["anvil"]);
    await click(el.querySelector("button"));
    await type("kanban");
    await key("Enter");
    await click(el.querySelector("button"));
    const recent = document.querySelector('[role=group][aria-labelledby$="srecent"]');
    expect(
      [...recent!.querySelectorAll("[role=option]")].map((o) => o.getAttribute("aria-label")),
    ).toEqual(["kanban", "anvil"]);
    expect(JSON.parse(window.localStorage.getItem("test-icons")!)).toEqual(["kanban", "anvil"]);
  });

  it("removes the icon and sets a tone", async () => {
    const onChange = vi.fn<(name: string | null) => void>();
    const onToneChange = vi.fn<(tone: string) => void>();
    await open({ defaultValue: "anvil", onChange, tones: true, onToneChange });
    await click(document.querySelector('[role=radio][aria-label="Accent"]'));
    expect(onToneChange).toHaveBeenCalledWith("accent");
    await click(document.querySelector(".fg-iconpick-remove"));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("clears the search with Escape before it closes", async () => {
    await open();
    await type("rocket");
    await key("Escape");
    expect(input().value).toBe("");
    expect(document.querySelector(".fg-iconpick")).not.toBeNull();
  });
});
