import type { PixelIcon } from "../types";

// Light bulb of `bulb` with a lightning bolt inside in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "bulb-charging",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....####",
    "..##....##",
    ".#........#",
    ".#.....o..#",
    ".#..oooo..#",
    "..#.o....#",
    "...#....#",
    "...######",
    "....####",
    "....####",
  ],
};

export default icon;
