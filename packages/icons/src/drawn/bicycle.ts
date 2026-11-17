import type { PixelIcon } from "../types";

// Bicycle: two round wheels, a diamond frame, a saddle and handlebars.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "bicycle",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "........##",
    "..###....#",
    "...#.....#",
    "...######",
    ".###.#..###",
    "#..##..##..#",
    "#..#.##.#..#",
    "#...#...#..#",
    ".###.....##",
  ],
};

export default icon;
