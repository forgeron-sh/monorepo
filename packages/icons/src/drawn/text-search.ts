import type { PixelIcon } from "../types";

// Text search: lines of text with a small magnifying glass, in the secondary tone, at the lower right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "text-search",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    "",
    "",
    ".##########",
    "",
    "......oo",
    ".####.o..o",
    "......o..o",
    ".......oo",
    ".####.....o",
    "...........o",
  ],
};

export default icon;
