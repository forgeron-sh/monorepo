// @vitest-environment jsdom
import { act, createElement as h, type ReactElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AddressField,
  AddressFieldPart,
  Composer,
  ComposerField,
  ComposerFooter,
  ConditionBuilder,
  ConditionBuilderGroup,
  DropZone,
  DropZoneDescription,
  DropZoneTitle,
  DropZoneTrigger,
  DurationInput,
  DurationInputHours,
  DurationInputMinutes,
  DurationInputPreset,
  DurationInputPresets,
  DurationInputRow,
  EmojiPicker,
  EmojiPickerGrid,
  EmojiPickerSearch,
  ExpressionInput,
  ExpressionInputBox,
  ExpressionInputField,
  JsonView,
  JsonViewContent,
  JsonViewCopy,
  JsonViewLabel,
  RichComposer,
  SecretField,
  SecretFieldBody,
  SecretFieldHeader,
  SignaturePad,
  SignaturePadDraw,
  SignaturePadModes,
  SignaturePadType,
  acceptsFile,
  emptyCondition,
  highlightJson,
  matchesAccept,
} from "./index";

// Components moved out of the blocks (D-157): the parts compose, the props-driven shapes stay.

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLElement | undefined;
let unmount: (() => void) | undefined;
const mount = async (element: ReactElement) => {
  host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  await act(async () => root.render(element));
  unmount = () => root.unmount();
  return host;
};
const click = async (el: Element | null) => {
  await act(async () => (el as HTMLElement).click());
};
afterEach(async () => {
  await act(async () => unmount?.());
  host?.remove();
  host = undefined;
});

describe("DurationInput", () => {
  it("composes: hours and minutes carry, a preset sets", async () => {
    const onValueChange = vi.fn<(minutes: number | null) => void>();
    const el = await mount(
      h(
        DurationInput,
        { "aria-label": "Length", defaultValue: 75, onValueChange },
        h(DurationInputRow, null, h(DurationInputHours), h(DurationInputMinutes)),
        h(DurationInputPresets, null, h(DurationInputPreset, { minutes: 30 })),
      ),
    );
    const inputs = el.querySelectorAll("input");
    expect(inputs[0]!.value).toBe("1");
    expect(inputs[1]!.value).toBe("15");
    await click(el.querySelector(".fg-dur-preset"));
    expect(onValueChange).toHaveBeenCalledWith(30);
    expect(el.querySelector(".fg-dur-preset")!.getAttribute("aria-pressed")).toBe("true");
  });
  it("keeps the old shape with a label", async () => {
    const onChange = vi.fn<(minutes: number | null) => void>();
    const el = await mount(h(DurationInput, { label: "Duration", defaultValue: 15, onChange }));
    await click(el.querySelectorAll(".fg-dur-preset")[1]!);
    expect(onChange).toHaveBeenCalledWith(30);
  });
});

describe("AddressField", () => {
  it("composes the parts it is given", async () => {
    const onValueChange = vi.fn<(value: object) => void>();
    const el = await mount(
      h(
        AddressField,
        { "aria-label": "Address", onValueChange },
        h(AddressFieldPart, { name: "line1", label: "Street" }),
        h(AddressFieldPart, { name: "city" }),
      ),
    );
    expect(el.querySelectorAll("input")).toHaveLength(2);
    expect(el.textContent).toContain("Street");
    expect(el.textContent).not.toContain("Postcode");
  });
  it("keeps the old shape: five fields", async () => {
    const el = await mount(h(AddressField, { label: "Address" }));
    expect(el.querySelectorAll("input")).toHaveLength(5);
  });
});

describe("SecretField", () => {
  it("composes: header and body without the hint", async () => {
    const el = await mount(
      h(
        SecretField,
        { label: "Key", isSet: true, getValue: () => "x" },
        h(SecretFieldHeader),
        h(SecretFieldBody),
      ),
    );
    expect(el.textContent).toContain("Key");
    expect(el.textContent).toContain("Reveal");
  });
  it("keeps the old shape", async () => {
    const el = await mount(h(SecretField, { label: "Key", isSet: false }));
    expect(el.textContent).toContain("Not set");
  });
});

describe("ExpressionInput", () => {
  it("composes the field alone", async () => {
    const el = await mount(
      h(
        ExpressionInput,
        { variables: [], defaultValue: "a {{ b }}", "aria-label": "Text" },
        h(ExpressionInputBox, null, h(ExpressionInputField)),
      ),
    );
    expect(el.querySelector(".fg-expr-token")?.textContent).toBe("{{ b }}");
    expect(el.querySelector(".fg-expr-fx")).toBeNull();
  });
  it("keeps the old shape with its button", async () => {
    const el = await mount(h(ExpressionInput, { variables: [], "aria-label": "Text" }));
    expect(el.querySelector(".fg-expr-fx")).not.toBeNull();
  });
});

describe("ConditionBuilder", () => {
  it("composes with the group part, and keeps the old shape", async () => {
    const fields = [{ id: "a", label: "A", type: "text" as const }];
    const onChange = vi.fn<(value: object) => void>();
    const el = await mount(
      h(
        ConditionBuilder,
        { fields, onChange, defaultValue: emptyCondition() },
        h(ConditionBuilderGroup),
      ),
    );
    await click(
      [...el.querySelectorAll("button")].find((b) => b.textContent === "Condition") ?? null,
    );
    expect(onChange).toHaveBeenCalledTimes(1);
    const el2 = await mount(h(ConditionBuilder, { fields }));
    expect(el2.querySelector(".fg-cond-group")).not.toBeNull();
  });
});

describe("JsonView", () => {
  it("composes: label, content and copy", async () => {
    const el = await mount(
      h(
        JsonView,
        { label: "Out", value: { a: 1 } },
        h(JsonViewLabel),
        h(JsonViewContent, null, h(JsonViewCopy)),
      ),
    );
    expect(el.querySelector("figcaption")?.textContent).toBe("Out");
    expect(el.querySelector(".fg-json-copy")).not.toBeNull();
    expect(el.querySelector(".fg-json-n")?.textContent).toBe("1");
  });
  it("keeps the old shape and highlightJson", async () => {
    const el = await mount(h(JsonView, { value: undefined, empty: "Nothing" }));
    expect(el.textContent).toContain("Nothing");
    expect(highlightJson('{"a": true}').length).toBeGreaterThan(1);
  });
});

describe("EmojiPicker", () => {
  it("composes: search then grid, and reports the choice", async () => {
    const onEmojiSelect = vi.fn<(emoji: string) => void>();
    const el = await mount(
      h(EmojiPicker, { onEmojiSelect }, h(EmojiPickerSearch), h(EmojiPickerGrid)),
    );
    expect(el.querySelector(".fg-conv-emoji-tabs")).toBeNull();
    await click(el.querySelector(".fg-conv-emoji-cell"));
    expect(onEmojiSelect).toHaveBeenCalledTimes(1);
  });
  it("keeps the old shape with onSelect", async () => {
    const onSelect = vi.fn<(emoji: string) => void>();
    const el = await mount(h(EmojiPicker, { onSelect }));
    expect(el.querySelector(".fg-conv-emoji-tabs")).not.toBeNull();
    await click(el.querySelector(".fg-conv-emoji-cell"));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});

describe("DropZone", () => {
  it("composes: the parts it is given and a chooser", async () => {
    const el = await mount(
      h(
        DropZone,
        { onDropFiles: () => {} },
        h(DropZoneTitle, null, "Drop"),
        h(DropZoneDescription, null, "PNG"),
        h(DropZoneTrigger, null, "Pick"),
      ),
    );
    expect(el.querySelector(".fg-dropzone-title")?.textContent).toBe("Drop");
    expect(el.querySelector("input[type=file]")).not.toBeNull();
    expect(el.querySelector(".fg-dropzone-icon")).toBeNull();
  });
  it("keeps the old shape, and acceptsFile shares matchesAccept", async () => {
    const el = await mount(h(DropZone, { onFiles: () => {}, description: "PDF" }));
    expect(el.querySelector("button")?.getAttribute("aria-describedby")).not.toBeNull();
    expect(acceptsFile({ name: "a.pdf", type: "" }, ".pdf")).toBe(true);
    expect(acceptsFile({ name: "a.png", type: "image/png" }, "application/pdf")).toBe(false);
    expect(acceptsFile({ name: "a", type: "" })).toBe(matchesAccept({ name: "a", type: "" }));
  });
});

describe("SignaturePad", () => {
  it("composes: only the modes it is given", async () => {
    const el = await mount(
      h(
        SignaturePad,
        { label: "Sign", modes: ["draw", "type"] },
        h(SignaturePadModes),
        h(SignaturePadDraw),
        h(SignaturePadType),
      ),
    );
    expect(el.querySelector("canvas")).not.toBeNull();
    expect(el.querySelector(".fg-sig-upload")).toBeNull();
  });
  it("keeps the old shape", async () => {
    const el = await mount(h(SignaturePad, { label: "Sign" }));
    expect(el.querySelector("canvas")).not.toBeNull();
  });
});

describe("Composer", () => {
  it("composes: the field and the footer, nothing else", async () => {
    const el = await mount(h(Composer, { onSend: () => {} }, h(ComposerField), h(ComposerFooter)));
    expect(el.querySelector("textarea")).not.toBeNull();
    expect(el.querySelector(".fg-conv-tools")).toBeNull();
  });
  it("RichComposer draws all the parts", async () => {
    const el = await mount(h(RichComposer, { onSend: () => {} }));
    expect(el.querySelector(".fg-conv-tools")).not.toBeNull();
    expect(el.querySelector(".fg-conv-composer-foot")).not.toBeNull();
  });
});
