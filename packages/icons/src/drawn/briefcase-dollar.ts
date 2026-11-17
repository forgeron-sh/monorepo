import type { PixelIcon } from "../types";

// Briefcase dollar: the briefcase of briefcase-01 with a dollar sign in the secondary tone in the lower-right corner.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "briefcase-dollar",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....####",
    "....#..#",
    ".##########",
    ".#........#",
    ".#........#",
    ".#",
    ".#......oooo",
    ".#.....oo",
    ".#......ooo",
    ".######...oo",
    ".......oooo",
  ],
};

export default icon;
