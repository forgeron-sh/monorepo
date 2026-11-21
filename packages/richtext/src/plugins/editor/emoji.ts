// Emoji, editor half: a `:` menu through the suggestion host. Typing `:` and a name (`:thumbs`)
// lists the matching emoji; picking one writes the Unicode character as plain text. No node: the
// document holds a character, so every reader, Markdown and plain text included, shows it as is.

import { type EmojiEntry, emoji as emojiCore, emojiPicker } from "../emoji";
import { defineEditorPlugin, defineSuggestion } from "../../tiptap/plugin";

export const emoji = defineEditorPlugin({
  core: emojiCore,
  suggestions: () => [
    defineSuggestion<EmojiEntry>({
      id: "emoji",
      char: ":",
      label: "Insert an emoji",
      empty: "No emoji matches",
      items: (query) => emojiPicker.search(query, 10),
      present: (item) => ({
        key: item.name,
        label: `${item.char}  ${item.name.replace(/_/g, " ")}`,
        hint: `:${item.name}`,
      }),
      // Not in code, and only where text can be typed.
      allow: ({ state, range }) => {
        const parent = state.doc.resolve(range.from).parent;
        return parent.isTextblock && !parent.type.spec.code;
      },
      command: ({ editor, range, item }) => {
        editor.chain().focus().insertContentAt(range, item.char).run();
      },
    }),
  ],
});
