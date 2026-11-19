// Images, editor half: the Tiptap image, offered in the slash menu only when the editor was given a
// way to ask the app for a picture (`requestImage`).

import Image from "@tiptap/extension-image";
import { image as imageCore } from "../image";
import { defineEditorPlugin } from "../../tiptap/plugin";
import { startChain } from "./kit";

export const image = defineEditorPlugin({
  core: imageCore,
  extensions: [Image.configure({ inline: false, allowBase64: true })],
  blocks: {
    image: {
      available: (ctx) => ctx.requestImage !== undefined,
      apply: ({ editor, range, requestImage }) => {
        if (!requestImage) return;
        startChain(editor, range).run();
        void requestImage().then((picked) => {
          if (picked) {
            editor
              .chain()
              .focus()
              .setImage({ src: picked.src, alt: picked.alt ?? "" })
              .run();
          }
        });
      },
    },
  },
});
