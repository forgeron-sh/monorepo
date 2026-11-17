import type { PixelIcon } from "../types";

// Pathfinder crop: the front square as a crop frame, the overlap kept, the frame dotted.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "pathfinder-crop",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    "",
    "....####o.o",
    "....#..#",
    "....#..#..o",
    "....####",
    "....o.....o",
    "",
    "....o.o.o.o",
  ],
};

export default icon;
