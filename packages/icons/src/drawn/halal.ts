import type { PixelIcon } from "../types";

// Halal: a round stamp with a crescent in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "halal",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#...ooo..#",
    ".#..oo....#",
    ".#..o.....#",
    ".#..o.....#",
    ".#..oo....#",
    ".#...ooo..#",
    "..#......#",
    "...######",
  ],
};

export default icon;
