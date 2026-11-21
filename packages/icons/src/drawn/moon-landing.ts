import type { PixelIcon } from "../types";

// Lunar lander standing on its legs on the ground, in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "moon-landing",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....####",
    "...#....#",
    "...#....#",
    "..########",
    "..#......#",
    "..########",
    ".#...##...#",
    "#..........#",
    "##........##",
    "",
    "oooooooooooo",
  ],
};

export default icon;
