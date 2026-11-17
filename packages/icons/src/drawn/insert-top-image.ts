import type { PixelIcon } from "../types";

// Picture above two lines of text: insert an image at the top.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "insert-top-image",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".oooooooooo",
    ".o........o",
    ".o........o",
    ".o........o",
    ".oooooooooo",
    "",
    ".##########",
    "",
    "",
    ".######",
  ],
};

export default icon;
