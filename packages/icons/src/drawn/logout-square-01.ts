import type { PixelIcon } from "../types";

// Sign out of a frame: a short-walled bracket and a two-pixel arrow leaving it in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "logout-square-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".#####",
    ".#...#",
    ".#.....oo",
    ".#......oo",
    ".#..ooooooo",
    ".#..ooooooo",
    ".#......oo",
    ".#.....oo",
    ".#...#",
    ".#####",
  ],
};

export default icon;
