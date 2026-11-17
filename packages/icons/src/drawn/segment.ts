import type { PixelIcon } from "../types";

// Segment: a straight line between two end points.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "segment",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "........ooo",
    "........o.o",
    "........ooo",
    ".......#",
    "......#",
    ".....#",
    "....#",
    ".ooo",
    ".o.o",
    ".ooo",
  ],
};

export default icon;
