import type { PixelIcon } from "../types";

// Right stroke: a dashed square whose right side is a solid line in the secondary tone, `stroke-left` mirrored.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "stroke-right",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".#.##..##.o",
    "..........o",
    ".#........o",
    ".#........o",
    "..........o",
    "..........o",
    ".#........o",
    ".#........o",
    "..........o",
    ".#.##..##.o",
  ],
};

export default icon;
