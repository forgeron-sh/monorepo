import type { PixelIcon } from "../types";

// Flip to the bottom: the top half of a card drawn solid, its mirror below dashed.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "flip-bottom",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#........#",
    ".#........#",
    ".##########",
    "",
    "",
    ".o........o",
    ".o........o",
    "..o.oooo.o",
  ],
};

export default icon;
