import type { PixelIcon } from "../types";

// Seashell: a scallop with a scalloped rim, two ribs converging to its hinge.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "shell",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..##.##.##",
    ".#..#..#..#",
    ".#..#..#..#",
    ".#..#..#..#",
    "..#.#..#.#",
    "...##..##",
    "....#..#",
    "...######",
  ],
};

export default icon;
