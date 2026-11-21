import type { PixelIcon } from "../types";

// Earth's crust: a block of ground under a mountain, its top layer solid in the secondary tone, a deeper layer below.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "geology-crust",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    "....#..#",
    "...#....#",
    ".##......##",
    ".#oooooooo#",
    ".#oooooooo#",
    ".#........#",
    ".##########",
    ".#........#",
    ".##########",
  ],
};

export default icon;
