import type { PixelIcon } from "../types";

// Pavilion: a curved pointed roof on four columns, a railing and a floor.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "pavilon",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".....##",
    "...##..##",
    ".##......##",
    "############",
    ".#..#..#..#",
    ".#..#..#..#",
    ".#..#..#..#",
    ".##########",
    ".#..#..#..#",
    "############",
  ],
};

export default icon;
