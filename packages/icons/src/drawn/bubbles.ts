import type { PixelIcon } from "../types";

// Three bubbles: a large ring, a medium ring and a small solid one.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "bubbles",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "........##",
    ".......#..#",
    ".......#..#",
    "........##",
    ".####",
    "#....#",
    "#....#..##",
    "#....#..##",
    "#....#",
    ".####",
  ],
};

export default icon;
