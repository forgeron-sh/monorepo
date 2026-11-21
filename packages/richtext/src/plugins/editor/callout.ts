// Callout, editor half: the Tiptap node (a tone, an optional emoji icon, blocks inside), a slash
// entry that wraps the block under the cursor, and a toolbar over the callout with the tone
// switcher. The icon of a tone is drawn by CSS (`layout.css`), so the node needs no node view and
// the static view looks the same.

import { Node, mergeAttributes } from "@tiptap/core";
import {
  AlertDiamondIcon,
  CancelCircleIcon,
  CheckmarkCircle01Icon,
  InformationCircleIcon,
  Note01Icon,
} from "@forgeron/icons";
import {
  CALLOUT_TONES,
  type CalloutTone,
  DEFAULT_CALLOUT_TONE,
  callout as calloutCore,
} from "../callout";
import { registerBlockIcons } from "../../react/icons";
import { type ToolbarItem, defineEditorPlugin } from "../../tiptap/plugin";
import { ancestor, setAncestorAttrs } from "./layout-kit";
import { startChain } from "./kit";

registerBlockIcons({ "information-circle": InformationCircleIcon });

const TONE_ICONS = {
  note: Note01Icon,
  info: InformationCircleIcon,
  success: CheckmarkCircle01Icon,
  warning: AlertDiamondIcon,
  danger: CancelCircleIcon,
} as const;

const LABELS: Record<CalloutTone, string> = {
  note: "Note",
  info: "Info",
  success: "Success",
  warning: "Warning",
  danger: "Danger",
};

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    callout: {
      /** Wraps the selected blocks in a callout. */
      setCallout: (attrs?: { tone?: CalloutTone; icon?: string }) => ReturnType;
      /** Changes the tone of the callout the cursor is in. */
      setCalloutTone: (tone: CalloutTone) => ReturnType;
      /** Sets the emoji icon of the callout the cursor is in; `null` goes back to the tone's own. */
      setCalloutIcon: (icon: string | null) => ReturnType;
    };
  }
}

export const CalloutNode = Node.create({
  name: "callout",
  group: "block",
  content: "block+",
  defining: true,
  addAttributes: () => ({
    tone: {
      default: DEFAULT_CALLOUT_TONE,
      parseHTML: (el) => el.getAttribute("data-tone") ?? DEFAULT_CALLOUT_TONE,
      renderHTML: (attrs) => ({ "data-tone": attrs["tone"] }),
    },
    icon: {
      default: null,
      parseHTML: (el) => el.querySelector(".fg-rt-callout-icon")?.textContent || null,
      rendered: false,
    },
  }),
  parseHTML: () => [{ tag: "aside.fg-rt-callout", contentElement: ".fg-rt-callout-body" }],
  renderHTML: ({ node, HTMLAttributes }) => [
    "aside",
    mergeAttributes({ class: "fg-rt-callout", role: "note" }, HTMLAttributes),
    [
      "span",
      { class: "fg-rt-callout-icon", contenteditable: "false", "aria-hidden": "true" },
      typeof node.attrs["icon"] === "string" ? node.attrs["icon"] : "",
    ],
    ["div", { class: "fg-rt-callout-body" }, 0],
  ],
  addCommands: () => ({
    setCallout:
      (attrs) =>
      ({ commands }) =>
        commands.wrapIn("callout", attrs),
    setCalloutTone:
      (tone) =>
      ({ tr }) =>
        setAncestorAttrs(tr, "callout", { tone }),
    setCalloutIcon:
      (icon) =>
      ({ tr }) =>
        setAncestorAttrs(tr, "callout", { icon }),
  }),
});

export const callout = defineEditorPlugin({
  core: calloutCore,
  extensions: [CalloutNode],
  blocks: {
    callout: {
      apply: ({ editor, range }) => void startChain(editor, range).setCallout().run(),
      isActive: (editor) => editor.isActive("callout"),
    },
  },
  turnable: ["callout"],
  blockToolbar: [
    {
      id: "callout",
      label: "Callout",
      node: "callout",
      items: [
        ...CALLOUT_TONES.map((tone): ToolbarItem => ({
          id: `tone-${tone}`,
          label: LABELS[tone],
          icon: TONE_ICONS[tone],
          active: (e) => ancestor(e, "callout")?.node.attrs["tone"] === tone,
          run: (e) => void e.chain().focus().setCalloutTone(tone).run(),
        })),
        {
          id: "icon-reset",
          label: "Reset icon",
          separatorBefore: true,
          disabled: (e) => !ancestor(e, "callout")?.node.attrs["icon"],
          run: (e) => void e.chain().focus().setCalloutIcon(null).run(),
        },
      ],
    },
  ],
});
