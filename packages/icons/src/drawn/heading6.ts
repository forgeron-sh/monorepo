import type { PixelIcon } from "../types";

// A heading of level 6: an H and the digit 6 in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "heading6",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".#...#",
    ".#...#...ooo",
    ".#...#...o",
    ".#####...ooo",
    ".#...#...o.o",
    ".#...#...o.o",
    ".#...#...ooo",
  ],
};

export default icon;
