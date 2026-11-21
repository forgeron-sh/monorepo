import type { PixelIcon } from "../types";

// Clapper-topped square of `play-list` with a heart badge in the shared lower-right corner.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "play-list-favourite-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#..#..#..#",
    ".##########",
    ".#........#",
    ".#",
    ".#....oo.oo",
    ".#....ooooo",
    ".#....ooooo",
    ".#.....ooo",
    "..####..o",
  ],
};

export default icon;
