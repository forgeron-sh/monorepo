import type { PixelIcon } from "../types";

// A person wearing a mortarboard in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "student",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".oooooooooo",
    "...######.o",
    "...#....#.o",
    "...#....#",
    "....####",
    "",
    "...######",
    "..#......#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
