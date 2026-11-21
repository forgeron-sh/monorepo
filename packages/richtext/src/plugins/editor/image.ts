// Images, editor half: the Tiptap image, offered in the slash menu only when the editor was given a
// way to ask the app for a picture (`requestImage`), or an `upload` function (the shared upload
// flow of the attachments family, `./upload`), in which case the entry opens a picker of images.

import Image from "@tiptap/extension-image";
import { image as imageCore } from "../image";
import { defineEditorPlugin } from "../../tiptap/plugin";
import { startChain } from "./kit";
import { pickFromSlash, uploadAvailable } from "./upload";

export const image = defineEditorPlugin({
  core: imageCore,
  extensions: [Image.configure({ inline: false, allowBase64: true })],
  blocks: {
    image: {
      available: (ctx) => ctx.requestImage !== undefined || uploadAvailable(ctx),
      apply: ({ editor, range, requestImage, ctx }) => {
        if (!requestImage) {
          if (uploadAvailable(ctx)) pickFromSlash(editor, range, "image/*");
          return;
        }
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
