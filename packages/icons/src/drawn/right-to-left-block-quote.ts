import type { PixelIcon } from "../types";

// Right-to-left block quote: the quote bar on the right, lines of text to its left.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "right-to-left-block-quote",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..........o",
    ".#######..o",
    "..........o",
    "..........o",
    "...#####..o",
    "..........o",
    "..........o",
    ".#######..o",
    "..........o",
  ],
};

export default icon;
