import type { PixelIcon } from "../types";

// Shrub: a wide rounded bush on a short trunk, standing on the ground.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "shrub",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "...##..##",
    "..#..##..#",
    ".#........#",
    "#..........#",
    "#..........#",
    ".#........#",
    "..###oo###",
    ".....oo",
    "############",
  ],
};

export default icon;
