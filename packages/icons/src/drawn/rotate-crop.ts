import type { PixelIcon } from "../types";

// Rotate and crop: the two frames of `crop`, two arcs with arrowheads in the secondary tone at opposite corners.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "rotate-crop",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "......ooo",
    "...#...o.o",
    "...#......o",
    ".########.o",
    "...#....#",
    "...#....#",
    "...#....#",
    "...#....#",
    ".o.########",
    ".o......#",
    "..o.o...#",
    "...ooo",
  ],
};

export default icon;
