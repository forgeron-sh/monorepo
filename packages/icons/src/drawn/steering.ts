import type { PixelIcon } from "../types";

// A steering wheel: the rim, a hub and three spokes.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "steering",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#........#",
    ".#..####..#",
    ".####..####",
    ".#..#..#..#",
    ".#..####..#",
    ".#...##...#",
    "..#..##..#",
    "...######",
  ],
};

export default icon;
