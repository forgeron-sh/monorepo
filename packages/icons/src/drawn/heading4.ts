import type { PixelIcon } from "../types";

// Heading 4: an H with a 4 in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "heading4",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".#...#",
    ".#...#...o.o",
    ".#...#...o.o",
    ".#####...o.o",
    ".#...#...ooo",
    ".#...#.....o",
    ".#...#.....o",
  ],
};

export default icon;
