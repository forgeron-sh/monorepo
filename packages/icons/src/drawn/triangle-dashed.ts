import type { PixelIcon } from "../types";

// Triangle with a dashed outline: the triangle broken into short runs.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "triangle-dashed",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    "....#..#",
    "....#..#",
    "",
    "...#....#",
    "..#......#",
    "",
    ".#........#",
    ".#........#",
    "..###..###",
  ],
};

export default icon;
