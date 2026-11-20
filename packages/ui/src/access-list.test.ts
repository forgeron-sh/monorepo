// @vitest-environment jsdom
import { act, createElement as h } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AccessList,
  AccessListItem,
  AccessListRemove,
  AccessListRole,
  PeopleCombobox,
} from "./access-list";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLElement | undefined;
afterEach(() => {
  host?.remove();
  document.body.innerHTML = "";
});
const mount = async (element: Parameters<ReturnType<typeof createRoot>["render"]>[0]) => {
  host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  await act(async () => root.render(element));
  return host;
};
const key = async (el: Element, k: string) =>
  act(async () => {
    el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));
  });
const typeInto = async (input: HTMLInputElement, value: string) =>
  act(async () => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
    setter.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
const wait = () => act(async () => new Promise((r) => setTimeout(r, 30)));

const people = [
  { id: "hb", name: "Hugo Bernard", hint: "Engineering" },
  { id: "np", name: "Nadia Petit", hint: "Finance" },
];

describe("PeopleCombobox", () => {
  it("filters on the name and the hint, adds the first match with Enter and clears the box", async () => {
    const onAdd = vi.fn<(...args: unknown[]) => void>();
    const el = await mount(h(PeopleCombobox, { people, onAdd }));
    const input = el.querySelector<HTMLInputElement>('[role="combobox"]')!;
    await act(async () => input.focus());
    await key(input, "ArrowDown");
    await typeInto(input, "fin");
    await wait();
    const options = document.querySelectorAll('[role="option"]');
    expect(options).toHaveLength(1);
    expect(options[0]!.textContent).toContain("Nadia Petit");
    await key(input, "Enter");
    expect(onAdd).toHaveBeenCalledWith(people[1]);
    expect(input.value).toBe("");
  });
  it("says so when nobody matches", async () => {
    const el = await mount(
      h(PeopleCombobox, {
        people,
        onAdd: vi.fn<(...args: unknown[]) => void>(),
        emptyText: "Nobody",
      }),
    );
    const input = el.querySelector<HTMLInputElement>('[role="combobox"]')!;
    await act(async () => input.focus());
    await key(input, "ArrowDown");
    await typeInto(input, "zzz");
    await wait();
    expect(document.body.textContent).toContain("Nobody");
  });
});

describe("AccessList", () => {
  it("draws a person with a line under the name and the controls given", async () => {
    const onRemove = vi.fn<(...args: unknown[]) => void>();
    const el = await mount(
      h(
        AccessList,
        { "aria-label": "People" },
        h(
          AccessListItem,
          { name: "Nadia Petit", secondary: "Finance", className: "mine" },
          h(AccessListRemove, { "aria-label": "Remove Nadia", onClick: onRemove }),
        ),
      ),
    );
    expect(el.querySelector("ul")!.getAttribute("aria-label")).toBe("People");
    const li = el.querySelector("li")!;
    expect(li.className).toContain("fg-access-item");
    expect(li.className).toContain("mine");
    expect(li.textContent).toContain("Nadia Petit");
    expect(li.textContent).toContain("Finance");
    await act(async () => el.querySelector<HTMLElement>('[aria-label="Remove Nadia"]')!.click());
    expect(onRemove).toHaveBeenCalled();
  });
  it("shows the role and offers the roles, then the removal", async () => {
    const onValueChange = vi.fn<(...args: unknown[]) => void>();
    const onRemove = vi.fn<(...args: unknown[]) => void>();
    const roles = [
      { value: "viewer", label: "Viewer" },
      { value: "editor", label: "Editor" },
    ];
    const el = await mount(
      h(AccessListRole, {
        label: "Role of Nadia",
        roles,
        value: "viewer",
        onValueChange,
        onRemove,
      }),
    );
    const trigger = el.querySelector<HTMLElement>('[aria-label="Role of Nadia"]')!;
    expect(trigger.textContent).toBe("Viewer");
    await act(async () => trigger.click());
    await wait();
    const rows = [...document.querySelectorAll('[role="option"]')];
    expect(rows.map((r) => r.textContent)).toEqual(["Viewer", "Editor", "Remove access"]);
    await act(async () => (rows[2] as HTMLElement).click());
    expect(onRemove).toHaveBeenCalled();
    expect(onValueChange).not.toHaveBeenCalled();
  });
});
