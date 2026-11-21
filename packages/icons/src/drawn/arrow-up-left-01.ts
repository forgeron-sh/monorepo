import type { PixelIcon } from "../types";

// Arrow pointing up and left: `arrow-up-right-01` mirrored.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "arrow-up-left-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "..######",
    "..##",
    "..#.#",
    "..#..#",
    "..#...#",
    "..#....#",
    "........#",
    ".........#",
  ],
};

export default icon;
