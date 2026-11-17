import type { PixelIcon } from "../types";

// Fireworks.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "fireworks",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    "..#..##..#",
    "...#....#",
    "",
    ".##......##",
    ".##......##",
    "",
    "...#....#",
    "..#..##..#",
    ".....##",
  ],
};

export default icon;
