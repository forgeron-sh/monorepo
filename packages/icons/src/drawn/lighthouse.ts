import type { PixelIcon } from "../types";

// Lighthouse: a tapering tower with a lamp room, its beams in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "lighthouse",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    "oo..####..oo",
    "....#..#",
    "oo..####..oo",
    "....#..#",
    "....#..#",
    "...#....#",
    "...#....#",
    "..#......#",
    "..#......#",
    ".##########",
  ],
};

export default icon;
