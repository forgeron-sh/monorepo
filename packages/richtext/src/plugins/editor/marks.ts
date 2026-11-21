// The marks, editor halves: the Tiptap extension of each and its button in the selection toolbar.

import { Bold } from "@tiptap/extension-bold";
import { Code } from "@tiptap/extension-code";
import { Italic } from "@tiptap/extension-italic";
import { Link } from "@tiptap/extension-link";
import { Strike } from "@tiptap/extension-strike";
import { Underline } from "@tiptap/extension-underline";
import { normalizeLink } from "../../core/view";
import {
  bold as boldCore,
  code as codeCore,
  italic as italicCore,
  link as linkCore,
  strike as strikeCore,
  underline as underlineCore,
} from "../marks";
import { UI_ICONS } from "../../react/icons";
import { defineEditorPlugin } from "../../tiptap/plugin";

export const bold = defineEditorPlugin({
  core: boldCore,
  extensions: [Bold],
  bubble: [
    {
      id: "bold",
      label: "Bold",
      icon: UI_ICONS.bold,
      order: 10,
      active: (e) => e.isActive("bold"),
      run: (e) => void e.chain().focus().toggleBold().run(),
    },
  ],
});

export const italic = defineEditorPlugin({
  core: italicCore,
  extensions: [Italic],
  bubble: [
    {
      id: "italic",
      label: "Italic",
      icon: UI_ICONS.italic,
      order: 20,
      active: (e) => e.isActive("italic"),
      run: (e) => void e.chain().focus().toggleItalic().run(),
    },
  ],
});

export const underline = defineEditorPlugin({
  core: underlineCore,
  extensions: [Underline],
  bubble: [
    {
      id: "underline",
      label: "Underline",
      icon: UI_ICONS.underline,
      order: 30,
      active: (e) => e.isActive("underline"),
      run: (e) => void e.chain().focus().toggleUnderline().run(),
    },
  ],
});

export const strike = defineEditorPlugin({
  core: strikeCore,
  extensions: [Strike],
  bubble: [
    {
      id: "strike",
      label: "Strikethrough",
      icon: UI_ICONS.strike,
      order: 40,
      active: (e) => e.isActive("strike"),
      run: (e) => void e.chain().focus().toggleStrike().run(),
    },
  ],
});

export const code = defineEditorPlugin({
  core: codeCore,
  extensions: [Code],
  bubble: [
    {
      id: "code",
      label: "Code",
      icon: UI_ICONS.code,
      order: 50,
      active: (e) => e.isActive("code"),
      run: (e) => void e.chain().focus().toggleCode().run(),
    },
  ],
});

export const link = defineEditorPlugin({
  core: linkCore,
  extensions: [
    Link.configure({
      openOnClick: false,
      autolink: true,
      defaultProtocol: "https",
      HTMLAttributes: { rel: "noopener noreferrer nofollow" },
    }),
  ],
  bubble: [
    {
      id: "link",
      label: "Link",
      icon: UI_ICONS.link,
      order: 60,
      separatorBefore: true,
      shortcut: "mod+k",
      active: (e) => e.isActive("link"),
      field: {
        label: "Link address",
        placeholder: "example.com",
        initial: (e) => (e.getAttributes("link")["href"] as string | undefined) ?? "",
        parse: normalizeLink,
        apply: (e, href) => void e.chain().focus().extendMarkRange("link").setLink({ href }).run(),
        remove: (e) => void e.chain().focus().extendMarkRange("link").unsetLink().run(),
        isActive: (e) => e.isActive("link"),
      },
    },
  ],
});

/** The six marks, in the order of the selection toolbar. */
export const markPlugins = [bold, italic, underline, strike, code, link] as const;
