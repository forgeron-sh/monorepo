import type { PixelIcon } from "../types";

// Image inserted at the bottom: two lines of text above a picture frame in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "insert-bottom-image",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    "",
    "",
    ".######",
    "",
    ".oooooooooo",
    ".o........o",
    ".o........o",
    ".o........o",
    ".oooooooooo",
  ],
};

export default icon;
