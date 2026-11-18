import type { PixelIcon } from "../types";

// Graduate, woman: `graduate-male` with long hair falling past the chin, the mortarboard in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "graduate-female",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....oooo",
    ".oooooooooo",
    "...#....#.o",
    "...#....#.o",
    "...#....#",
    "..#......#",
    "",
    "...######",
    "..#......#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
