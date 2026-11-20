// @vitest-environment jsdom
import { act, createElement as h } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup as html } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  Activity,
  CommentComposer,
  CreateDialog,
  PropertyChips,
  PropertyPanel,
  PropertyText,
  StatusPicker,
} from "../index";
import type { ActivityItem } from "../index";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLElement | undefined;
let root: ReturnType<typeof createRoot> | undefined;
afterEach(async () => {
  if (root) await act(async () => root!.unmount());
  host?.remove();
  host = undefined;
  root = undefined;
});
const mount = async (element: Parameters<ReturnType<typeof createRoot>["render"]>[0]) => {
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  await act(async () => root!.render(element));
  return host;
};

const type = async (field: HTMLTextAreaElement | HTMLInputElement, value: string) => {
  const proto = Object.getPrototypeOf(field) as object;
  const setter = Object.getOwnPropertyDescriptor(proto, "value")!.set!;
  await act(async () => {
    setter.call(field, value);
    field.dispatchEvent(new Event("input", { bubbles: true }));
  });
};
const press = async (target: Element, init: KeyboardEventInit) => {
  await act(async () => {
    target.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, ...init }));
  });
};

describe("PropertyPanel", () => {
  it("groups the rows under their headings, label then control", () => {
    const out = html(
      h(PropertyPanel, {
        rows: [
          { heading: "Properties" },
          { label: "Status", control: h(StatusPicker, { defaultValue: "review" }) },
          {
            label: "Created",
            control: h(PropertyText, { dim: true, children: "Hugo Bernard · 3 Nov" }),
          },
          { heading: "Labels" },
          { label: "Labels", control: "Bug", hideLabel: true },
        ],
      }),
    );
    expect(out).toContain('aria-label="Properties"');
    expect(out.match(/<section/g)).toHaveLength(2);
    expect(out).toContain('<h3 class="fg-props-heading">Labels</h3>');
    expect(out).toContain('<dt class="fg-props-label">Status</dt>');
    expect(out).toContain("In Review");
    expect(out).toContain("fg-props-dim");
    expect(out).toContain('<dt class="fg-sr">Labels</dt>');
    expect(out).toContain("fg-props-wide");
  });

  it("puts rows before any heading in a group of their own", () => {
    const out = html(h(PropertyPanel, { rows: [{ label: "Due", control: "18 Nov" }] }));
    expect(out).not.toContain("<h3");
    expect(out).toContain("<dt");
  });

  it("lays the chips in a named group", () => {
    const out = html(h(PropertyChips, { label: "Issue properties", children: "x" }));
    expect(out).toContain('role="group"');
    expect(out).toContain('aria-label="Issue properties"');
  });
});

const items: ActivityItem[] = [
  { kind: "event", id: "1", author: "Camille Roy", text: "created the issue", time: "3 Nov" },
  {
    kind: "event",
    id: "2",
    author: "Hugo Bernard",
    text: "moved it to In Review",
    time: "2 h ago",
    dateTime: "2026-11-17T08:00",
  },
  {
    kind: "comment",
    id: "3",
    author: "Nadia Petit",
    body: "Thanks. Two suppliers called about it this morning.",
    time: "1 h ago",
    highlighted: true,
    quote: { author: "Hugo Bernard", text: "The fix is in review." },
  },
];

describe("Activity", () => {
  it("lists events and comments in order, times as given", () => {
    const out = html(h(Activity, { items }));
    expect(out).toContain("<ol");
    expect(out.match(/<li/g)).toHaveLength(3);
    expect(out).toContain("<b>Hugo Bernard</b> moved it to In Review");
    expect(out).toMatch(/<time [^>]*dateTime="2026-11-17T08:00"[^>]*>2 h ago<\/time>/);
    expect(out).toContain('aria-label="Comment by Nadia Petit"');
    expect(out).toContain("fg-activity-highlighted");
    expect(out).toContain("<blockquote");
    expect(out).not.toContain("textarea");
  });

  it("shows a labelled composer when it can post", () => {
    const out = html(h(Activity, { items, onSubmit: () => {} }));
    expect(out).toContain("<textarea");
    expect(out).toMatch(/<label for="[^"]+" class="fg-sr">Comment<\/label>/);
    expect(out).toContain('placeholder="Leave a comment…"');
  });
});

describe("CommentComposer", () => {
  it("sends the trimmed text on ⌘↵ and empties itself", async () => {
    const onSubmit = vi.fn<(value: unknown) => void>();
    const el = await mount(h(CommentComposer, { onSubmit }));
    const box = el.querySelector("textarea")!;
    const button = el.querySelector("button")!;
    expect(button.disabled).toBe(true);
    await press(box, { key: "Enter", metaKey: true });
    expect(onSubmit).not.toHaveBeenCalled();
    await type(box, "  Fixed on staging.  ");
    expect(button.disabled).toBe(false);
    await press(box, { key: "Enter" });
    expect(onSubmit).not.toHaveBeenCalled();
    await press(box, { key: "Enter", ctrlKey: true });
    expect(onSubmit).toHaveBeenCalledWith("Fixed on staging.");
    expect(box.value).toBe("");
  });

  it("leaves a draft kept by the caller alone", async () => {
    const onSubmit = vi.fn<(value: unknown) => void>();
    const el = await mount(h(CommentComposer, { onSubmit, value: "Kept", onChange: () => {} }));
    await act(async () => el.querySelector("form")!.requestSubmit());
    expect(onSubmit).toHaveBeenCalledWith("Kept");
    expect(el.querySelector("textarea")!.value).toBe("Kept");
  });
});

describe("CreateDialog", () => {
  it("refuses an empty title, creates on ⌘↵, then closes", async () => {
    const onSubmit = vi.fn<(value: unknown) => void>();
    const onOpenChange = vi.fn<(open: boolean) => void>();
    await mount(h(CreateDialog, { open: true, onOpenChange, onSubmit, properties: "chips" }));
    const title = document.querySelector<HTMLInputElement>(".fg-create-title")!;
    expect(title).not.toBeNull();
    expect(document.body.textContent).toContain("New issue");
    await press(title, { key: "Enter", metaKey: true });
    expect(onSubmit).not.toHaveBeenCalled();
    expect(title.getAttribute("aria-invalid")).toBe("true");
    expect(title.placeholder).toBe("A title is required");
    await type(title, " Supplier invoices arrive twice ");
    expect(title.hasAttribute("aria-invalid")).toBe(false);
    await press(title, { key: "Enter", metaKey: true });
    expect(onSubmit).toHaveBeenCalledWith({
      title: "Supplier invoices arrive twice",
      description: "",
      createMore: false,
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("stays open and empties with Create more", async () => {
    const onSubmit = vi.fn<(value: unknown) => void>();
    const onOpenChange = vi.fn<(open: boolean) => void>();
    await mount(h(CreateDialog, { open: true, onOpenChange, onSubmit, defaultCreateMore: true }));
    const title = document.querySelector<HTMLInputElement>(".fg-create-title")!;
    const desc = document.querySelector<HTMLTextAreaElement>(".fg-create-desc")!;
    await type(title, "One");
    await type(desc, "Details");
    await press(desc, { key: "Enter", ctrlKey: true });
    expect(onSubmit).toHaveBeenCalledWith({
      title: "One",
      description: "Details",
      createMore: true,
    });
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(title.value).toBe("");
    expect(desc.value).toBe("");
  });

  it("renders nothing while closed", async () => {
    await mount(h(CreateDialog, { open: false, onOpenChange: () => {}, onSubmit: () => {} }));
    expect(document.querySelector(".fg-create")).toBeNull();
  });
});
