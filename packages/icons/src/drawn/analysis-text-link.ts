import type { PixelIcon } from "../types";

// Three lines of text with a chain-link badge in the lower-right corner.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "analysis-text-link",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    "",
    ".##########",
    "",
    ".########",
    "",
    ".#####..ooo",
    "........o.o",
    "......ooooo",
    "......o.o",
    "......ooo",
  ],
};

export default icon;
