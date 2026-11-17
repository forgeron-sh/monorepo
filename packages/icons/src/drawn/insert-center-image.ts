import type { PixelIcon } from "../types";

// Image inserted in the middle: a picture frame in the secondary tone between two lines of text.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "insert-center-image",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    "",
    "",
    ".oooooooooo",
    ".o........o",
    ".o........o",
    ".oooooooooo",
    "",
    "",
    ".######",
  ],
};

export default icon;
