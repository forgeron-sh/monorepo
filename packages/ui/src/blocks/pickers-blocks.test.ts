// @vitest-environment jsdom
// The blocks that pick from a filtered list: all of them are built on the Combobox parts.
import { Clock01Icon, Mail01Icon, Message01Icon } from "@forgeron/icons";
import { act, createElement as h } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ProductPicker,
  RecipientInput,
  RelationPicker,
  StepPicker,
  type ProductOption,
} from "../index";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLElement | undefined;
let reactRoot: ReturnType<typeof createRoot> | undefined;
afterEach(async () => {
  await act(async () => reactRoot?.unmount());
  reactRoot = undefined;
  host?.remove();
  host = undefined;
  document.body.innerHTML = "";
});
const mount = async (element: Parameters<ReturnType<typeof createRoot>["render"]>[0]) => {
  host = document.createElement("div");
  document.body.append(host);
  reactRoot = createRoot(host);
  await act(async () => reactRoot!.render(element));
  return host;
};
const click = (el: Element | null | undefined) => act(async () => (el as HTMLElement).click());
const key = (el: Element, k: string) =>
  act(async () => {
    el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));
  });
/** Typed text: the combobox opens its list on an input event that names its `inputType`. */
const typeIn = (el: HTMLInputElement, value: string) =>
  act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(el, value);
    el.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText" }));
  });
const options = () => [...document.querySelectorAll('[role="option"]')];

describe("RelationPicker", () => {
  const targets = [
    { id: "acme", label: "Acme", hint: "ACM-1" },
    { id: "globex", label: "Globex" },
    { id: "initech", label: "Initech" },
  ];

  it("picks one record and closes", async () => {
    const onChange = vi.fn<(ids: string[]) => void>();
    const el = await mount(h(RelationPicker, { label: "Company", targets, onChange }));
    await click(el.querySelector(".fg-dh-relpick"));
    expect(options()).toHaveLength(3);
    expect(document.querySelector(".fg-fpop-head input")).not.toBeNull();
    await click(options()[1]);
    expect(onChange).toHaveBeenLastCalledWith(["globex"]);
    expect(document.querySelector(".fg-dh-relpop")).toBeNull();
    expect(el.querySelector(".fg-dh-relchip")?.textContent).toBe("Globex");
  });

  it("filters by what is typed, and ticks several", async () => {
    const onChange = vi.fn<(ids: string[]) => void>();
    const el = await mount(
      h(RelationPicker, {
        label: "Company",
        targets,
        multiple: true,
        defaultValue: ["acme"],
        onChange,
      }),
    );
    await click(el.querySelector(".fg-dh-relpick"));
    expect(document.querySelectorAll(".fg-check-box")).toHaveLength(3);
    await typeIn(document.querySelector<HTMLInputElement>(".fg-fpop-head input")!, "in");
    expect(options()).toHaveLength(1);
    await click(options()[0]);
    expect(onChange).toHaveBeenLastCalledWith(["acme", "initech"]);
    expect(document.querySelector(".fg-dh-relpop")).not.toBeNull();
  });
});

describe("ProductPicker", () => {
  const products: ProductOption[] = [
    { id: "a", label: "Anvil", hint: "SKU-1", unitPrice: 1500 },
    { id: "b", label: "Bellows", hint: "SKU-2" },
  ];
  it("opens a search over the catalogue and picks with Enter", async () => {
    const onPick = vi.fn<(product: ProductOption) => void>();
    const el = await mount(h(ProductPicker, { products, onPick, currency: "EUR" }));
    await click(el.querySelector(".fg-fin-pick"));
    const input = document.querySelector<HTMLInputElement>(".fg-fpop-head input")!;
    expect(input.getAttribute("role")).toBe("combobox");
    await typeIn(input, "bel");
    expect(options()).toHaveLength(1);
    await key(input, "ArrowDown");
    await key(input, "Enter");
    expect(onPick).toHaveBeenCalledWith(products[1]);
  });
});

describe("StepPicker on the combobox", () => {
  const steps = [
    { id: "schedule", label: "Schedule", icon: Clock01Icon, group: "trigger", tag: "cron" },
    { id: "mail", label: "Send mail", app: "Mail", icon: Mail01Icon, group: "apps" },
    { id: "chat", label: "Post message", app: "Chat", icon: Message01Icon, group: "apps" },
  ];
  it("groups the steps under their heading and narrows them by category", async () => {
    const onPick = vi.fn<(id: string) => void>();
    const el = await mount(h(StepPicker, { options: steps, onPick }));
    expect([...el.querySelectorAll(".fg-spick-group")].map((g) => g.textContent)).toEqual([
      "trigger",
      "apps",
    ]);
    expect(el.querySelector(".fg-spick-tag")?.textContent).toBe("cron");
    await click([...el.querySelectorAll(".fg-spick-cat")].find((b) => b.textContent === "apps"));
    expect(el.querySelectorAll('[role="option"]')).toHaveLength(2);
    await click(el.querySelectorAll('[role="option"]')[1]);
    expect(onPick).toHaveBeenLastCalledWith("chat");
  });
  it("says so when nothing matches", async () => {
    const el = await mount(h(StepPicker, { options: steps, onPick: () => {}, empty: "Nothing" }));
    await typeIn(el.querySelector("input")!, "zzz");
    expect(el.querySelector(".fg-spick-empty")?.textContent).toBe("Nothing");
  });
});

describe("RecipientInput on the combobox", () => {
  const input = (el: HTMLElement) => el.querySelector<HTMLInputElement>("input")!;
  it("commits a typed address on Enter when nothing is suggested, removes with Backspace", async () => {
    const onChange = vi.fn<(value: string[]) => void>();
    const el = await mount(h(RecipientInput, { label: "To", onChange }));
    await typeIn(input(el), "me@x.io");
    await key(input(el), "Enter");
    expect(onChange).toHaveBeenLastCalledWith(["me@x.io"]);
    await key(input(el), "Backspace");
    expect(onChange).toHaveBeenLastCalledWith([]);
  });
  it("removes a chip with its button", async () => {
    const onChange = vi.fn<(value: string[]) => void>();
    const el = await mount(
      h(RecipientInput, { label: "To", defaultValue: ["a@x.io", "b@x.io"], onChange }),
    );
    await click(el.querySelector('[aria-label="Remove a@x.io"]'));
    expect(onChange).toHaveBeenLastCalledWith(["b@x.io"]);
  });
});
