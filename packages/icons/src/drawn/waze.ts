import type { PixelIcon } from "../types";

// The Waze mark: a round smiling face with two eyes, riding on two wheels.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "waze",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "...######",
    "..#......#",
    ".#........#",
    ".#..#..#..#",
    ".#........#",
    "#...#..#..#",
    "##...##...#",
    ".#.......#",
    "..#######",
    "..##...##",
    "..##...##",
  ],
};

export default icon;
