import type { PixelIcon } from "../types";

// Flip to the top: the bottom half of a card drawn solid, its mirror above dashed.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "flip-top",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..o.oooo.o",
    ".o........o",
    ".o........o",
    "",
    "",
    ".##########",
    ".#........#",
    ".#........#",
    ".#........#",
    "..########",
  ],
};

export default icon;
