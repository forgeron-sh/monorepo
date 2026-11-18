import type { PixelIcon } from "../types";

// Wooden stake: a post with a pointed tip driven into the ground line in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "stake",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....####",
    "....#..#",
    "....#..#",
    "....#..#",
    "....#..#",
    "....#..#",
    "....#..#",
    ".ooo#..#ooo",
    "....#..#",
    ".....##",
  ],
};

export default icon;
