import type { PixelIcon } from "../types";

// Flip to the left: the right half of a card drawn solid, its mirror on the left dashed.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "flip-left",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..oo..####",
    ".o....#...#",
    "......#...#",
    ".o....#...#",
    ".o....#...#",
    ".o....#...#",
    ".o....#...#",
    "......#...#",
    ".o....#...#",
    "..oo..####",
  ],
};

export default icon;
