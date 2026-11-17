import type { PixelIcon } from "../types";

// Motorbike seen from the side: two wheels, a seat, a tank and the handlebar fork.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "motorbike-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".......##",
    "........#",
    "..###...#",
    "...#######",
    "...####..#",
    ".##.....##",
    "#..#....#..#",
    "#..#....#..#",
    ".##......##",
  ],
};

export default icon;
